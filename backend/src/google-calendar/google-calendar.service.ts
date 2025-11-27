import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';

/**
 * Serviço de integração com Google Calendar
 * Sincroniza agendamentos da clínica com o calendário
 */
@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private oauth2Client;

  constructor() {
    // Configurar OAuth2 Client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google-calendar/callback',
    );
  }

  /**
   * Gera URL de autorização OAuth2
   * @returns URL para o usuário autorizar acesso ao Google Calendar
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  /**
   * Troca código de autorização por tokens
   * @param code Código retornado pelo Google após autorização
   * @returns Tokens de acesso e refresh
   */
  async getTokensFromCode(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      this.logger.log('Tokens obtidos com sucesso');
      return tokens;
    } catch (error) {
      this.logger.error('Erro ao obter tokens:', error);
      throw error;
    }
  }

  /**
   * Define tokens de acesso (para usuário já autorizado)
   * @param tokens Tokens salvos no banco de dados
   */
  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Cria evento no Google Calendar
   * @param agendamento Dados do agendamento
   * @returns ID do evento criado
   */
  async createEvent(agendamento: {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    attendees?: string[];
  }): Promise<string> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event = {
        summary: agendamento.summary,
        description: agendamento.description,
        start: {
          dateTime: agendamento.start.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: agendamento.end.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        attendees: agendamento.attendees?.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 dia antes
            { method: 'popup', minutes: 60 }, // 1 hora antes
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      this.logger.log(`Evento criado: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      this.logger.error('Erro ao criar evento:', error);
      throw error;
    }
  }

  /**
   * Atualiza evento no Google Calendar
   * @param eventId ID do evento no Google Calendar
   * @param agendamento Novos dados do agendamento
   */
  async updateEvent(eventId: string, agendamento: {
    summary?: string;
    description?: string;
    start?: Date;
    end?: Date;
  }): Promise<void> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event: any = {};
      if (agendamento.summary) event.summary = agendamento.summary;
      if (agendamento.description) event.description = agendamento.description;
      if (agendamento.start) {
        event.start = {
          dateTime: agendamento.start.toISOString(),
          timeZone: 'America/Sao_Paulo',
        };
      }
      if (agendamento.end) {
        event.end = {
          dateTime: agendamento.end.toISOString(),
          timeZone: 'America/Sao_Paulo',
        };
      }

      await calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: event,
      });

      this.logger.log(`Evento atualizado: ${eventId}`);
    } catch (error) {
      this.logger.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }

  /**
   * Cancela evento no Google Calendar
   * @param eventId ID do evento no Google Calendar
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });

      this.logger.log(`Evento cancelado: ${eventId}`);
    } catch (error) {
      this.logger.error('Erro ao cancelar evento:', error);
      throw error;
    }
  }

  /**
   * Lista eventos do calendário
   * @param startDate Data inicial
   * @param endDate Data final
   * @returns Lista de eventos
   */
  async listEvents(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      this.logger.error('Erro ao listar eventos:', error);
      throw error;
    }
  }
}
