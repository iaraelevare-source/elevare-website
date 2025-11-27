import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { dataSourceOptions } from '../../config/database.config';
import { Clinic } from '../entities/clinic.entity';
import { User } from '../entities/user.entity';
import { Lead } from '../entities/lead.entity';
import { Agendamento } from '../entities/agendamento.entity';

/**
 * Script de seed para popular o banco de dados com dados de teste
 * Cria uma clínica de exemplo com usuários, leads e agendamentos
 */
async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...');

  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  try {
    // Limpa dados existentes (apenas em desenvolvimento)
    console.log('🗑️  Limpando dados existentes...');
    await dataSource.query('TRUNCATE TABLE agendamentos, leads, users, clinics CASCADE');

    // Cria clínica de teste
    console.log('🏥 Criando clínica de teste...');
    const clinicRepository = dataSource.getRepository(Clinic);
    const clinic = clinicRepository.create({
      nome: 'Clínica Estética Elevare',
      cnpj: '12.345.678/0001-90',
      telefone: '11999999999',
      endereco: 'Rua das Flores, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567',
      plano: 'profissional',
      ativo: true,
    });
    await clinicRepository.save(clinic);
    console.log(`✅ Clínica criada: ${clinic.nome} (ID: ${clinic.id})`);

    // Cria usuários de teste
    console.log('👥 Criando usuários de teste...');
    const userRepository = dataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash('senha123', 10);

    const adminUser = userRepository.create({
      email: 'admin@elevare.com',
      password: hashedPassword,
      nome: 'Admin Elevare',
      role: 'admin',
      clinicId: clinic.id,
      ativo: true,
    });
    await userRepository.save(adminUser);
    console.log(`✅ Usuário admin criado: ${adminUser.email}`);

    const atendenteUser = userRepository.create({
      email: 'atendente@elevare.com',
      password: hashedPassword,
      nome: 'Maria Atendente',
      role: 'atendente',
      clinicId: clinic.id,
      ativo: true,
    });
    await userRepository.save(atendenteUser);
    console.log(`✅ Usuário atendente criado: ${atendenteUser.email}`);

    // Cria leads de teste
    console.log('📋 Criando leads de teste...');
    const leadRepository = dataSource.getRepository(Lead);

    const leads = [
      {
        nome: 'Ana Silva',
        email: 'ana@email.com',
        telefone: '11988887777',
        procedimentoInteresse: 'Botox',
        origem: 'instagram',
        temWhatsapp: true,
        faixaEtaria: 32,
        jaRealizouProcedimento: true,
        status: 'novo',
        clinicId: clinic.id,
        createdById: atendenteUser.id,
      },
      {
        nome: 'Beatriz Costa',
        email: 'beatriz@email.com',
        telefone: '11977776666',
        procedimentoInteresse: 'Preenchimento Labial',
        origem: 'indicacao',
        temWhatsapp: true,
        faixaEtaria: 28,
        jaRealizouProcedimento: false,
        status: 'contatado',
        clinicId: clinic.id,
        createdById: atendenteUser.id,
      },
      {
        nome: 'Carlos Mendes',
        email: 'carlos@email.com',
        telefone: '11966665555',
        procedimentoInteresse: 'Limpeza de Pele',
        origem: 'google',
        temWhatsapp: false,
        faixaEtaria: 45,
        jaRealizouProcedimento: true,
        status: 'qualificado',
        clinicId: clinic.id,
        createdById: adminUser.id,
      },
    ];

    for (const leadData of leads) {
      const lead = leadRepository.create(leadData);
      await leadRepository.save(lead);
      console.log(`✅ Lead criado: ${lead.nome} (Score: ${lead.score})`);
    }

    // Cria agendamentos de teste
    console.log('📅 Criando agendamentos de teste...');
    const agendamentoRepository = dataSource.getRepository(Agendamento);

    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const proximaSemana = new Date(hoje);
    proximaSemana.setDate(proximaSemana.getDate() + 7);

    const agendamentos = [
      {
        clienteNome: 'Ana Silva',
        clienteEmail: 'ana@email.com',
        clienteTelefone: '11988887777',
        procedimento: 'Botox',
        dataHora: amanha.setHours(14, 0, 0, 0),
        duracaoMinutos: 60,
        valor: 800.0,
        status: 'agendado',
        clinicId: clinic.id,
        createdById: atendenteUser.id,
      },
      {
        clienteNome: 'Beatriz Costa',
        clienteEmail: 'beatriz@email.com',
        clienteTelefone: '11977776666',
        procedimento: 'Preenchimento Labial',
        dataHora: proximaSemana.setHours(10, 30, 0, 0),
        duracaoMinutos: 90,
        valor: 1200.0,
        status: 'confirmado',
        confirmadoPeloCliente: true,
        dataConfirmacao: new Date(),
        clinicId: clinic.id,
        createdById: atendenteUser.id,
      },
    ];

    for (const agendamentoData of agendamentos) {
      const agendamento = agendamentoRepository.create(agendamentoData);
      await agendamentoRepository.save(agendamento);
      console.log(`✅ Agendamento criado: ${agendamento.clienteNome} - ${agendamento.procedimento}`);
    }

    console.log('\n✅ Seed concluído com sucesso!');
    console.log('\n📝 Credenciais de teste:');
    console.log('   Admin: admin@elevare.com / senha123');
    console.log('   Atendente: atendente@elevare.com / senha123');

  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// Executa o seed
seed().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
