import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Users, Eye, Info, Mail, Plus, Edit2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EditEmailModal } from "@/components/modals/EditEmailModal";
import { useFeedback } from "@/contexts/FeedbackContext";
import { useAuth } from "@/contexts/AuthContext";

interface Beneficiary {
  matricula: number;
  nome: string;
  cpf: number;
  situacao: number;
  dtnasc: string;
  sexo: string;
  email: string;
  telefone: string;
  cidade: string;
  uf: string;
  endereco?: string;
  bairro?: string;
  numero?: string;
  complemento?: string;
  cep?: number;
}

interface LinkedDependent {
  matricula: number;
  nrodep: number | null;
  nome: string | null;
  parent: number | null;
  situacao: number | null;
  dtnasc: string | null;
  sexo: string | null;
  cpf: string | null;
  nomemae: string | null;
  email: string | null;
  parentesco_nome?: string;
}

interface ParentescoOption {
  codigo: number;
  nome: string;
}

export function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [isEditEmailModalOpen, setIsEditEmailModalOpen] = useState(false);
  const [beneficiaryToEdit, setBeneficiaryToEdit] = useState<Beneficiary | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingBeneficiary, setIsCreatingBeneficiary] = useState(false);
  const [isEditBeneficiaryModalOpen, setIsEditBeneficiaryModalOpen] = useState(false);
  const [isUpdatingBeneficiary, setIsUpdatingBeneficiary] = useState(false);
  const [beneficiaryToUpdate, setBeneficiaryToUpdate] = useState<Beneficiary | null>(null);
  const [isDependentsModalOpen, setIsDependentsModalOpen] = useState(false);
  const [isDependentFormOpen, setIsDependentFormOpen] = useState(false);
  const [isSavingDependent, setIsSavingDependent] = useState(false);
  const [dependentTargetBeneficiary, setDependentTargetBeneficiary] = useState<Beneficiary | null>(null);
  const [editingDependent, setEditingDependent] = useState<LinkedDependent | null>(null);
  const [dependentsByMatricula, setDependentsByMatricula] = useState<Record<number, LinkedDependent[]>>({});
  const [parentescoOptions, setParentescoOptions] = useState<ParentescoOption[]>([]);
  const [loadingDependents, setLoadingDependents] = useState(false);
  const [newBeneficiaryForm, setNewBeneficiaryForm] = useState({
    matricula: "",
    nome: "",
    cpf: "",
    situacao: "1",
    dtnasc: "",
    sexo: "",
    email: "",
    telefone: "",
    cidade: "",
    uf: "",
    endereco: "",
    bairro: "",
    numero: "",
    complemento: "",
    cep: "",
  });
  const [editBeneficiaryForm, setEditBeneficiaryForm] = useState({
    nome: "",
    cpf: "",
    situacao: "1",
    dtnasc: "",
    sexo: "",
    email: "",
    telefone: "",
    cidade: "",
    uf: "",
    endereco: "",
    bairro: "",
    numero: "",
    complemento: "",
    cep: "",
  });
  const [dependentForm, setDependentForm] = useState({
    nrodep: "",
    nome: "",
    cpf: "",
    parent: "",
    situacao: "1",
    dtnasc: "",
    sexo: "",
    nomemae: "",
    email: "",
  });
  const { mostrarFeedback, mostrarToast } = useFeedback();
  const { session } = useAuth();
  const canCreateNewBeneficiary = session?.user?.cargo === 'DESENVOLVEDOR';
  const canCreateBeneficiary = ['GERENTE', 'ANALISTA DE SISTEMAS', 'DESENVOLVEDOR'].includes(session?.user?.cargo || '');

  useEffect(() => {
    const loadParentescos = async () => {
      try {
        const { data, error } = await supabase
          .from('tabgrpar')
          .select('codigo, nome')
          .order('codigo');

        if (error) throw error;
        setParentescoOptions(data || []);
      } catch (error) {
        console.error('Erro ao carregar tabela de parentescos:', error);
      }
    };

    void loadParentescos();
  }, []);

  const SkeletonCard = () => (
    <div className="border border-border rounded-lg p-3 sm:p-4">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="skeleton-shimmer h-5 w-48 rounded"></div>
          <div className="flex items-center gap-2">
            <div className="skeleton-shimmer h-6 w-16 rounded"></div>
            <div className="skeleton-shimmer h-8 w-8 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div className="skeleton-shimmer h-4 w-32 rounded"></div>
          <div className="skeleton-shimmer h-4 w-36 rounded"></div>
          <div className="skeleton-shimmer h-4 w-28 rounded"></div>
          <div className="skeleton-shimmer h-4 w-20 rounded"></div>
          <div className="skeleton-shimmer h-4 w-32 rounded"></div>
          <div className="skeleton-shimmer h-4 w-16 rounded"></div>
        </div>
      </div>
    </div>
  );

  const searchBeneficiaries = async () => {
    if (!searchTerm.trim()) {
      setBeneficiaries([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      let query = supabase
        .from('cadben')
        .select('matricula, nome, cpf, situacao, dtnasc, sexo, email, telefone, cidade, uf, endereco, bairro, numero, complemento, cep');

      // Aplicar filtros de busca
      if (searchTerm.trim()) {
        const isNumeric = /^\d+$/.test(searchTerm.trim());
        
        if (isNumeric) {
          // Se for numérico, buscar por matrícula ou CPF
          query = query.or(`matricula.eq.${searchTerm},cpf.eq.${searchTerm}`);
        } else {
          // Se não for numérico, buscar por nome
          query = query.ilike('nome', `%${searchTerm}%`);
        }
      }

      // Aplicar filtro de status se selecionado
      if (statusFilter !== null) {
        if (statusFilter === 1) {
          // Ativos e Reativados
          query = query.in('situacao', [1, 2]);
        } else {
          query = query.eq('situacao', statusFilter);
        }
      }

      query = query.order('nome').limit(100);
      
      const { data, error } = await query;

      if (error) throw error;
      setBeneficiaries(data || []);
    } catch (error) {
      console.error('Erro ao buscar beneficiários:', error);
      setBeneficiaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchBeneficiaries();
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, statusFilter]);

  const getStatusBadge = (situacao: number) => {
    switch (situacao) {
      case 1:
        return <Badge variant="default">Ativo</Badge>;
      case 2:
        return <Badge variant="secondary">Reativado</Badge>;
      case 3:
        return <Badge variant="destructive">Inativo</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const formatCPF = (cpf: number) => {
    if (!cpf && cpf !== 0) return '-';
    const cpfStr = cpf.toString().padStart(11, '0');
    return cpfStr.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateStr || '-';
    }
  };

  // Filtros já aplicados na query, não precisamos filtrar novamente
  const filteredBeneficiaries = beneficiaries || [];

  const handleEditEmail = (beneficiary: Beneficiary) => {
    setBeneficiaryToEdit(beneficiary);
    setIsEditEmailModalOpen(true);
  };

  const handleEmailUpdateSuccess = () => {
    // Refresh the beneficiaries list to show updated email
    searchBeneficiaries();
  };

  const loadLinkedDependents = async (matricula: number) => {
    try {
      setLoadingDependents(true);

      const { data, error } = await supabase
        .from('caddep')
        .select('matricula, nrodep, nome, parent, situacao, dtnasc, sexo, cpf, nomemae, email, tabgrpar!fk_caddep_parent_tabgrpar(nome)')
        .eq('matricula', matricula)
        .order('nrodep', { ascending: true });

      if (error) throw error;

      const dependents = (data || []).map((item: any) => ({
        matricula: item.matricula,
        nrodep: item.nrodep,
        nome: item.nome,
        parent: item.parent,
        situacao: item.situacao,
        dtnasc: item.dtnasc,
        sexo: item.sexo,
        cpf: item.cpf,
        nomemae: item.nomemae,
        email: item.email,
        parentesco_nome: item.tabgrpar?.nome || 'Não informado',
      })) as LinkedDependent[];

      setDependentsByMatricula((prev) => ({ ...prev, [matricula]: dependents }));
    } catch (error) {
      console.error('Erro ao carregar dependentes vinculados:', error);
      mostrarFeedback('erro', 'Erro', 'Não foi possível carregar os dependentes do associado.');
    } finally {
      setLoadingDependents(false);
    }
  };

  const handleOpenEditBeneficiary = (beneficiary: Beneficiary) => {
    setBeneficiaryToUpdate(beneficiary);
    setEditBeneficiaryForm({
      nome: beneficiary.nome || "",
      cpf: beneficiary.cpf ? String(beneficiary.cpf).padStart(11, '0') : "",
      situacao: String(beneficiary.situacao ?? 1),
      dtnasc: beneficiary.dtnasc || "",
      sexo: beneficiary.sexo || "",
      email: beneficiary.email || "",
      telefone: beneficiary.telefone || "",
      cidade: beneficiary.cidade || "",
      uf: beneficiary.uf || "",
      endereco: beneficiary.endereco || "",
      bairro: beneficiary.bairro || "",
      numero: beneficiary.numero || "",
      complemento: beneficiary.complemento || "",
      cep: beneficiary.cep ? String(beneficiary.cep) : "",
    });
    setIsEditBeneficiaryModalOpen(true);
  };

  const handleUpdateBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!beneficiaryToUpdate) return;

    const cpfNumbers = editBeneficiaryForm.cpf.replace(/\D/g, '');
    const cepNumbers = editBeneficiaryForm.cep.replace(/\D/g, '');

    if (!editBeneficiaryForm.nome.trim()) {
      mostrarFeedback('erro', 'Erro', 'Informe o nome do associado.');
      return;
    }

    if (cpfNumbers && cpfNumbers.length !== 11) {
      mostrarFeedback('erro', 'Erro', 'CPF deve ter 11 dígitos.');
      return;
    }

    try {
      setIsUpdatingBeneficiary(true);

      const { error } = await supabase
        .from('cadben')
        .update({
          nome: editBeneficiaryForm.nome.trim(),
          cpf: cpfNumbers ? Number(cpfNumbers) : null,
          situacao: Number(editBeneficiaryForm.situacao) || 1,
          dtnasc: editBeneficiaryForm.dtnasc || null,
          sexo: editBeneficiaryForm.sexo || null,
          email: editBeneficiaryForm.email.trim() || null,
          telefone: editBeneficiaryForm.telefone.trim() || null,
          cidade: editBeneficiaryForm.cidade.trim() || null,
          uf: editBeneficiaryForm.uf.trim().toUpperCase() || null,
          endereco: editBeneficiaryForm.endereco.trim() || null,
          bairro: editBeneficiaryForm.bairro.trim() || null,
          numero: editBeneficiaryForm.numero.trim() || null,
          complemento: editBeneficiaryForm.complemento.trim() || null,
          cep: cepNumbers ? Number(cepNumbers) : null,
        })
        .eq('matricula', beneficiaryToUpdate.matricula);

      if (error) throw error;

      mostrarToast('sucesso', 'Associado atualizado com sucesso!');
      setIsEditBeneficiaryModalOpen(false);
      setBeneficiaryToUpdate(null);
      await searchBeneficiaries();
    } catch (error) {
      console.error('Erro ao atualizar associado:', error);
      mostrarFeedback('erro', 'Erro', 'Não foi possível atualizar o associado.');
    } finally {
      setIsUpdatingBeneficiary(false);
    }
  };

  const handleOpenDependentsModal = async (beneficiary: Beneficiary) => {
    setDependentTargetBeneficiary(beneficiary);
    setIsDependentsModalOpen(true);
    await loadLinkedDependents(beneficiary.matricula);
  };

  const handleOpenCreateDependent = () => {
    if (!dependentTargetBeneficiary) return;
    const existing = dependentsByMatricula[dependentTargetBeneficiary.matricula] || [];
    const maxNrodep = existing.reduce((acc, dep) => Math.max(acc, dep.nrodep || 0), 0);

    setEditingDependent(null);
    setDependentForm({
      nrodep: String(maxNrodep + 1),
      nome: "",
      cpf: "",
      parent: "",
      situacao: "1",
      dtnasc: "",
      sexo: "",
      nomemae: "",
      email: "",
    });
    setIsDependentFormOpen(true);
  };

  const handleOpenEditDependent = (dependent: LinkedDependent) => {
    setEditingDependent(dependent);
    setDependentForm({
      nrodep: String(dependent.nrodep || ""),
      nome: dependent.nome || "",
      cpf: dependent.cpf || "",
      parent: dependent.parent ? String(dependent.parent) : "",
      situacao: String(dependent.situacao ?? 1),
      dtnasc: dependent.dtnasc || "",
      sexo: dependent.sexo || "",
      nomemae: dependent.nomemae || "",
      email: dependent.email || "",
    });
    setIsDependentFormOpen(true);
  };

  const handleSaveDependent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dependentTargetBeneficiary) return;

    const nrodep = Number(dependentForm.nrodep);
    const cpfNumbers = dependentForm.cpf.replace(/\D/g, '');

    if (!Number.isInteger(nrodep) || nrodep <= 0) {
      mostrarFeedback('erro', 'Erro', 'Informe um número de dependente válido.');
      return;
    }

    if (!dependentForm.nome.trim()) {
      mostrarFeedback('erro', 'Erro', 'Informe o nome do dependente.');
      return;
    }

    if (cpfNumbers && cpfNumbers.length !== 11) {
      mostrarFeedback('erro', 'Erro', 'CPF do dependente deve ter 11 dígitos.');
      return;
    }

    try {
      setIsSavingDependent(true);

      const payload = {
        matricula: dependentTargetBeneficiary.matricula,
        nome: dependentForm.nome.trim(),
        cpf: cpfNumbers || null,
        parent: dependentForm.parent ? Number(dependentForm.parent) : null,
        situacao: Number(dependentForm.situacao) || 1,
        dtnasc: dependentForm.dtnasc || null,
        sexo: dependentForm.sexo || null,
        nomemae: dependentForm.nomemae.trim() || null,
        email: dependentForm.email.trim() || null,
      };

      if (editingDependent) {
        const { error } = await supabase
          .from('caddep')
          .update(payload)
          .eq('matricula', dependentTargetBeneficiary.matricula)
          .eq('nrodep', editingDependent.nrodep);

        if (error) throw error;
        mostrarToast('sucesso', 'Dependente atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('caddep').insert({
          ...payload,
          nrodep,
        });
        if (error) throw error;
        mostrarToast('sucesso', 'Dependente cadastrado com sucesso!');
      }

      setIsDependentFormOpen(false);
      setEditingDependent(null);
      await loadLinkedDependents(dependentTargetBeneficiary.matricula);
    } catch (error: any) {
      console.error('Erro ao salvar dependente:', error);
      if (error?.code === '23505') {
        mostrarFeedback('erro', 'Erro', 'Já existe dependente com esse número para a matrícula.');
      } else {
        mostrarFeedback('erro', 'Erro', 'Não foi possível salvar o dependente.');
      }
    } finally {
      setIsSavingDependent(false);
    }
  };

  const handleCreateBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();

    const matricula = Number(newBeneficiaryForm.matricula);
    const cpfNumbers = newBeneficiaryForm.cpf.replace(/\D/g, '');
    const cepNumbers = newBeneficiaryForm.cep.replace(/\D/g, '');

    if (!Number.isInteger(matricula) || matricula <= 0) {
      mostrarFeedback('erro', 'Erro', 'Informe uma matrícula válida.');
      return;
    }

    if (!newBeneficiaryForm.nome.trim()) {
      mostrarFeedback('erro', 'Erro', 'Informe o nome do associado.');
      return;
    }

    if (cpfNumbers && cpfNumbers.length !== 11) {
      mostrarFeedback('erro', 'Erro', 'CPF deve ter 11 dígitos.');
      return;
    }

    try {
      setIsCreatingBeneficiary(true);

      const payload = {
        matricula,
        nome: newBeneficiaryForm.nome.trim(),
        cpf: cpfNumbers ? Number(cpfNumbers) : null,
        situacao: Number(newBeneficiaryForm.situacao) || 1,
        dtnasc: newBeneficiaryForm.dtnasc || null,
        sexo: newBeneficiaryForm.sexo || null,
        email: newBeneficiaryForm.email.trim() || null,
        telefone: newBeneficiaryForm.telefone.trim() || null,
        cidade: newBeneficiaryForm.cidade.trim() || null,
        uf: newBeneficiaryForm.uf.trim().toUpperCase() || null,
        endereco: newBeneficiaryForm.endereco.trim() || null,
        bairro: newBeneficiaryForm.bairro.trim() || null,
        numero: newBeneficiaryForm.numero.trim() || null,
        complemento: newBeneficiaryForm.complemento.trim() || null,
        cep: cepNumbers ? Number(cepNumbers) : null,
      };

      const { error } = await supabase.from('cadben').insert(payload);
      if (error) throw error;

      mostrarToast('sucesso', 'Associado cadastrado com sucesso!');
      setIsCreateModalOpen(false);
      setNewBeneficiaryForm({
        matricula: "",
        nome: "",
        cpf: "",
        situacao: "1",
        dtnasc: "",
        sexo: "",
        email: "",
        telefone: "",
        cidade: "",
        uf: "",
        endereco: "",
        bairro: "",
        numero: "",
        complemento: "",
        cep: "",
      });

      setSearchTerm(String(matricula));
    } catch (error: any) {
      console.error('Erro ao cadastrar associado:', error);
      if (error?.code === '23505') {
        mostrarFeedback('erro', 'Erro', 'Já existe um associado com essa matrícula.');
      } else {
        mostrarFeedback('erro', 'Erro', 'Não foi possível cadastrar o associado.');
      }
    } finally {
      setIsCreatingBeneficiary(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 sm:h-8 sm:w-8" />
            Associados
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerenciamento de associados FUNSEP
          </p>
        </div>
        {canCreateNewBeneficiary && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Cadastrar novo associado
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar novo associado</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateBeneficiary} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="novo-matricula">Matrícula *</Label>
                    <Input
                      id="novo-matricula"
                      value={newBeneficiaryForm.matricula}
                      onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, matricula: e.target.value.replace(/\D/g, '') }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novo-cpf">CPF</Label>
                    <Input
                      id="novo-cpf"
                      placeholder="Somente números"
                      value={newBeneficiaryForm.cpf}
                      onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novo-nome">Nome *</Label>
                  <Input
                    id="novo-nome"
                    value={newBeneficiaryForm.nome}
                    onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, nome: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="novo-dtnasc">Data de Nascimento</Label>
                    <Input
                      id="novo-dtnasc"
                      type="date"
                      value={newBeneficiaryForm.dtnasc}
                      onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, dtnasc: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novo-sexo">Sexo</Label>
                    <select
                      id="novo-sexo"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newBeneficiaryForm.sexo}
                      onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, sexo: e.target.value }))}
                    >
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="novo-email">E-mail</Label>
                    <Input
                      id="novo-email"
                      type="email"
                      value={newBeneficiaryForm.email}
                      onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novo-telefone">Telefone</Label>
                    <Input
                      id="novo-telefone"
                      value={newBeneficiaryForm.telefone}
                      onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, telefone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="novo-cidade">Cidade</Label>
                    <Input
                      id="novo-cidade"
                      value={newBeneficiaryForm.cidade}
                      onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, cidade: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novo-uf">UF</Label>
                    <Input
                      id="novo-uf"
                      maxLength={2}
                      value={newBeneficiaryForm.uf}
                      onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novo-endereco">Endereço</Label>
                  <Input
                    id="novo-endereco"
                    value={newBeneficiaryForm.endereco}
                    onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, endereco: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="novo-bairro">Bairro</Label>
                    <Input
                      id="novo-bairro"
                      value={newBeneficiaryForm.bairro}
                      onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, bairro: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novo-numero">Número</Label>
                    <Input
                      id="novo-numero"
                      value={newBeneficiaryForm.numero}
                      onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, numero: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="novo-complemento">Complemento</Label>
                    <Input
                      id="novo-complemento"
                      value={newBeneficiaryForm.complemento}
                      onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, complemento: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novo-cep">CEP</Label>
                    <Input
                      id="novo-cep"
                      value={newBeneficiaryForm.cep}
                      onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, cep: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novo-status">Situação</Label>
                  <select
                    id="novo-status"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newBeneficiaryForm.situacao}
                    onChange={(e) => setNewBeneficiaryForm((prev) => ({ ...prev, situacao: e.target.value }))}
                  >
                    <option value="1">Ativo</option>
                    <option value="2">Reativado</option>
                    <option value="3">Inativo</option>
                  </select>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreatingBeneficiary}>
                    {isCreatingBeneficiary ? 'Cadastrando...' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm sm:text-base">Gerenciamento de Associados</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Busque e visualize informações dos associados. Use nome, matrícula ou CPF para localizar registros.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nome, matrícula ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm sm:text-base"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            className="flex-shrink-0 h-8"
            data-small-button
            onClick={() => setStatusFilter(null)}
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === 1 ? "default" : "outline"}
            size="sm"
            className="flex-shrink-0 h-8"
            data-small-button
            onClick={() => setStatusFilter(1)}
          >
            Ativos
          </Button>
          <Button
            variant={statusFilter === 3 ? "default" : "outline"}
            size="sm"
            className="flex-shrink-0 h-8"
            data-small-button
            onClick={() => setStatusFilter(3)}
          >
            Inativos
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            {hasSearched ? (
              `Associados encontrados (${filteredBeneficiaries.length})`
            ) : (
              "Digite no campo de busca para encontrar associados"
            )}
            {filteredBeneficiaries.length === 100 && (
              <span className="text-xs sm:text-sm text-muted-foreground block mt-1">
                (máximo 100 resultados exibidos - refine sua busca se necessário)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-4">
            {!hasSearched ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Use o campo de busca acima para encontrar associados</p>
                <p className="text-sm">Digite nome, matrícula ou CPF</p>
              </div>
            ) : loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : Array.isArray(filteredBeneficiaries) && filteredBeneficiaries.map((beneficiary) => (
              <div
                key={beneficiary.matricula}
                className="border border-border rounded-lg p-3 sm:p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="font-semibold text-sm sm:text-base leading-tight">
                      {beneficiary.nome || 'Nome não informado'}
                    </h3>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(beneficiary.situacao)}
                      {canCreateBeneficiary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditBeneficiary(beneficiary)}
                          title="Editar associado"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {canCreateBeneficiary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDependentsModal(beneficiary)}
                          title="Gerenciar dependentes"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEmail(beneficiary)}
                        title="Editar email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBeneficiary(beneficiary)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-base sm:text-lg">Detalhes do Associado</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-2">DADOS PESSOAIS</h4>
                                <div className="space-y-2">
                                  <div>
                                    <strong>Nome:</strong> {beneficiary.nome || '-'}
                                  </div>
                                  <div>
                                    <strong>CPF:</strong> {beneficiary.cpf ? formatCPF(beneficiary.cpf) : '-'}
                                  </div>
                                  <div>
                                    <strong>Data de Nascimento:</strong> {formatDate(beneficiary.dtnasc)}
                                  </div>
                                  <div>
                                    <strong>Sexo:</strong> {beneficiary.sexo || '-'}
                                  </div>
                                  <div>
                                    <strong>Status:</strong> {getStatusBadge(beneficiary.situacao)}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-2">LOCALIZAÇÃO</h4>
                                <div className="space-y-2">
                                  <div>
                                    <strong>Cidade:</strong> {beneficiary.cidade || '-'}
                                  </div>
                                  <div>
                                    <strong>UF:</strong> {beneficiary.uf || '-'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-sm text-muted-foreground mb-2">CONTATO</h4>
                              <div className="space-y-2">
                                <div>
                                  <strong>Email:</strong> {beneficiary.email || '-'}
                                </div>
                                <div>
                                  <strong>Telefone:</strong> {beneficiary.telefone || '-'}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-sm text-muted-foreground mb-2">INFORMAÇÕES ADMINISTRATIVAS</h4>
                              <div className="space-y-2">
                                <div>
                                  <strong>Matrícula:</strong> {beneficiary.matricula || '-'}
                                </div>
                                <div>
                                  <strong>Situação:</strong> 
                                  <span className="ml-2">
                                    {beneficiary.situacao === 1 ? 'Ativo' : 
                                     beneficiary.situacao === 2 ? 'Reativado' :
                                     beneficiary.situacao === 3 ? 'Inativo' : 'Desconhecido'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div>
                      <strong>Matrícula:</strong> {beneficiary.matricula || '-'}
                    </div>
                    <div>
                      <strong>CPF:</strong> {beneficiary.cpf ? formatCPF(beneficiary.cpf) : '-'}
                    </div>
                    <div>
                      <strong>Nascimento:</strong> {formatDate(beneficiary.dtnasc)}
                    </div>
                    <div>
                      <strong>Sexo:</strong> {beneficiary.sexo || '-'}
                    </div>
                    <div>
                      <strong>Cidade:</strong> {beneficiary.cidade || '-'}
                    </div>
                    <div>
                      <strong>UF:</strong> {beneficiary.uf || '-'}
                    </div>
                  </div>
                  
                  {(beneficiary.email || beneficiary.telefone) && (
                    <div className="space-y-1 pt-2 border-t border-border/50">
                      {beneficiary.email && (
                        <div className="text-xs sm:text-sm">
                          <strong>Email:</strong> 
                          <span className="break-all ml-1">{beneficiary.email}</span>
                        </div>
                      )}
                      
                      {beneficiary.telefone && (
                        <div className="text-xs sm:text-sm">
                          <strong>Telefone:</strong> {beneficiary.telefone}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {hasSearched && (!Array.isArray(filteredBeneficiaries) || filteredBeneficiaries.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum associado encontrado</p>
                <p className="text-sm">Tente ajustar os termos da busca</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditEmailModal
        isOpen={isEditEmailModalOpen}
        onClose={() => setIsEditEmailModalOpen(false)}
        beneficiario={beneficiaryToEdit}
        onSuccess={handleEmailUpdateSuccess}
      />

      <Dialog open={isEditBeneficiaryModalOpen} onOpenChange={setIsEditBeneficiaryModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar associado</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateBeneficiary} className="space-y-4">
            <div className="space-y-2">
              <Label>Matrícula</Label>
              <Input value={beneficiaryToUpdate?.matricula || ''} readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={editBeneficiaryForm.nome}
                onChange={(e) => setEditBeneficiaryForm((prev) => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cpf">CPF</Label>
                <Input
                  id="edit-cpf"
                  value={editBeneficiaryForm.cpf}
                  onChange={(e) => setEditBeneficiaryForm((prev) => ({ ...prev, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dtnasc">Data de Nascimento</Label>
                <Input
                  id="edit-dtnasc"
                  type="date"
                  value={editBeneficiaryForm.dtnasc}
                  onChange={(e) => setEditBeneficiaryForm((prev) => ({ ...prev, dtnasc: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sexo">Sexo</Label>
                <select
                  id="edit-sexo"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editBeneficiaryForm.sexo}
                  onChange={(e) => setEditBeneficiaryForm((prev) => ({ ...prev, sexo: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Situação</Label>
                <select
                  id="edit-status"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editBeneficiaryForm.situacao}
                  onChange={(e) => setEditBeneficiaryForm((prev) => ({ ...prev, situacao: e.target.value }))}
                >
                  <option value="1">Ativo</option>
                  <option value="2">Reativado</option>
                  <option value="3">Inativo</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cep">CEP</Label>
                <Input
                  id="edit-cep"
                  value={editBeneficiaryForm.cep}
                  onChange={(e) => setEditBeneficiaryForm((prev) => ({ ...prev, cep: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editBeneficiaryForm.email}
                  onChange={(e) => setEditBeneficiaryForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input
                  id="edit-telefone"
                  value={editBeneficiaryForm.telefone}
                  onChange={(e) => setEditBeneficiaryForm((prev) => ({ ...prev, telefone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-cidade">Cidade</Label>
                <Input
                  id="edit-cidade"
                  value={editBeneficiaryForm.cidade}
                  onChange={(e) => setEditBeneficiaryForm((prev) => ({ ...prev, cidade: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-uf">UF</Label>
                <Input
                  id="edit-uf"
                  maxLength={2}
                  value={editBeneficiaryForm.uf}
                  onChange={(e) => setEditBeneficiaryForm((prev) => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-endereco">Endereço</Label>
              <Input
                id="edit-endereco"
                value={editBeneficiaryForm.endereco}
                onChange={(e) => setEditBeneficiaryForm((prev) => ({ ...prev, endereco: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-bairro">Bairro</Label>
                <Input
                  id="edit-bairro"
                  value={editBeneficiaryForm.bairro}
                  onChange={(e) => setEditBeneficiaryForm((prev) => ({ ...prev, bairro: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-numero">Número</Label>
                <Input
                  id="edit-numero"
                  value={editBeneficiaryForm.numero}
                  onChange={(e) => setEditBeneficiaryForm((prev) => ({ ...prev, numero: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-complemento">Complemento</Label>
              <Input
                id="edit-complemento"
                value={editBeneficiaryForm.complemento}
                onChange={(e) => setEditBeneficiaryForm((prev) => ({ ...prev, complemento: e.target.value }))}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditBeneficiaryModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdatingBeneficiary}>
                {isUpdatingBeneficiary ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDependentsModalOpen}
        onOpenChange={(open) => {
          setIsDependentsModalOpen(open);
          if (!open) {
            setDependentTargetBeneficiary(null);
            setEditingDependent(null);
            setIsDependentFormOpen(false);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Dependentes vinculados - {dependentTargetBeneficiary?.nome || 'Associado'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleOpenCreateDependent} className="gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar dependente
              </Button>
            </div>

            {loadingDependents ? (
              <p className="text-sm text-muted-foreground">Carregando dependentes...</p>
            ) : (
              <div className="space-y-2">
                {(dependentsByMatricula[dependentTargetBeneficiary?.matricula || 0] || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum dependente cadastrado para este associado.</p>
                ) : (
                  (dependentsByMatricula[dependentTargetBeneficiary?.matricula || 0] || []).map((dep) => (
                    <div key={`${dep.matricula}-${dep.nrodep}`} className="border rounded-lg p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="font-medium">{dep.nome || '-'}</p>
                          <p className="text-xs text-muted-foreground">
                            Nº {dep.nrodep || '-'} • {dep.parentesco_nome || 'Sem parentesco'} • {dep.cpf || 'CPF não informado'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditDependent(dep)} className="gap-2">
                          <Edit2 className="h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDependentFormOpen} onOpenChange={setIsDependentFormOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDependent ? 'Editar dependente' : 'Cadastrar dependente'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveDependent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dep-nrodep">Nº Dependente *</Label>
                <Input
                  id="dep-nrodep"
                  value={dependentForm.nrodep}
                  readOnly
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Número sequencial automático por associado.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dep-parent">Parentesco</Label>
                <select
                  id="dep-parent"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={dependentForm.parent}
                  onChange={(e) => setDependentForm((prev) => ({ ...prev, parent: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  {parentescoOptions.map((option) => (
                    <option key={option.codigo} value={option.codigo}>{option.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dep-nome">Nome *</Label>
              <Input
                id="dep-nome"
                value={dependentForm.nome}
                onChange={(e) => setDependentForm((prev) => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dep-cpf">CPF</Label>
                <Input
                  id="dep-cpf"
                  value={dependentForm.cpf}
                  onChange={(e) => setDependentForm((prev) => ({ ...prev, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dep-dtnasc">Data de Nascimento</Label>
                <Input
                  id="dep-dtnasc"
                  type="date"
                  value={dependentForm.dtnasc}
                  onChange={(e) => setDependentForm((prev) => ({ ...prev, dtnasc: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dep-sexo">Sexo</Label>
                <select
                  id="dep-sexo"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={dependentForm.sexo}
                  onChange={(e) => setDependentForm((prev) => ({ ...prev, sexo: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dep-situacao">Situação</Label>
                <select
                  id="dep-situacao"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={dependentForm.situacao}
                  onChange={(e) => setDependentForm((prev) => ({ ...prev, situacao: e.target.value }))}
                >
                  <option value="1">Ativo</option>
                  <option value="2">Reativado</option>
                  <option value="3">Inativo</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dep-nomemae">Nome da Mãe</Label>
              <Input
                id="dep-nomemae"
                value={dependentForm.nomemae}
                onChange={(e) => setDependentForm((prev) => ({ ...prev, nomemae: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dep-email">E-mail</Label>
              <Input
                id="dep-email"
                type="email"
                value={dependentForm.email}
                onChange={(e) => setDependentForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDependentFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingDependent}>
                {isSavingDependent ? 'Salvando...' : 'Salvar dependente'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
