export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          sigla: string
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          sigla: string
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          sigla?: string
          token?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          app_area: string | null
          created_at: string
          element: string | null
          event_type: string
          extra: Json | null
          id: string
          is_admin: boolean | null
          label: string | null
          page: string | null
          path: string | null
          platform: string | null
          referrer: string | null
          target: string | null
          url: string | null
          user_agent: string | null
          user_cargo: string | null
          user_matricula: number | null
          user_nome: string | null
          user_sigla: string | null
        }
        Insert: {
          app_area?: string | null
          created_at?: string
          element?: string | null
          event_type: string
          extra?: Json | null
          id?: string
          is_admin?: boolean | null
          label?: string | null
          page?: string | null
          path?: string | null
          platform?: string | null
          referrer?: string | null
          target?: string | null
          url?: string | null
          user_agent?: string | null
          user_cargo?: string | null
          user_matricula?: number | null
          user_nome?: string | null
          user_sigla?: string | null
        }
        Update: {
          app_area?: string | null
          created_at?: string
          element?: string | null
          event_type?: string
          extra?: Json | null
          id?: string
          is_admin?: boolean | null
          label?: string | null
          page?: string | null
          path?: string | null
          platform?: string | null
          referrer?: string | null
          target?: string | null
          url?: string | null
          user_agent?: string | null
          user_cargo?: string | null
          user_matricula?: number | null
          user_nome?: string | null
          user_sigla?: string | null
        }
        Relationships: []
      }
      cadben: {
        Row: {
          agencia: string | null
          bairro: string | null
          banco: string | null
          cargo: number | null
          cartprof: string | null
          cep: number | null
          cidade: string | null
          codunimed: string | null
          complemento: string | null
          contacorr: string | null
          cpf: number | null
          datacadastro: string | null
          datamovimentacao: string | null
          ddd: string | null
          ddd1: string | null
          ddd2: string | null
          dtbaseecco: string | null
          dtbaseplano: string | null
          dtbasesit: string | null
          dtemirg: string | null
          dtnasc: string | null
          email: string | null
          empresa: number | null
          endereco: string | null
          estcivil: number | null
          faixaetaria: number | null
          formapgmen: number | null
          identidade: string | null
          limcrednissei: string | null
          localtrab: number | null
          matnoipe: string | null
          matrfunc: string | null
          matricula: number
          motcanc: number | null
          nome: string | null
          nomemae: string | null
          numero: string | null
          orgemi: string | null
          pispasep: string | null
          serie: string | null
          sexo: string | null
          siglacadastro: string | null
          siglamovimentacao: string | null
          sitdrogamed: string | null
          sitecco: string | null
          sitfarmaline: string | null
          sitgolden: string | null
          sitnissei: string | null
          situacao: number | null
          telefone: string | null
          telefone1: string | null
          telefone2: string | null
          tipacomoda: number | null
          tipofunc: string | null
          tipoplano: number | null
          uf: string | null
        }
        Insert: {
          agencia?: string | null
          bairro?: string | null
          banco?: string | null
          cargo?: number | null
          cartprof?: string | null
          cep?: number | null
          cidade?: string | null
          codunimed?: string | null
          complemento?: string | null
          contacorr?: string | null
          cpf?: number | null
          datacadastro?: string | null
          datamovimentacao?: string | null
          ddd?: string | null
          ddd1?: string | null
          ddd2?: string | null
          dtbaseecco?: string | null
          dtbaseplano?: string | null
          dtbasesit?: string | null
          dtemirg?: string | null
          dtnasc?: string | null
          email?: string | null
          empresa?: number | null
          endereco?: string | null
          estcivil?: number | null
          faixaetaria?: number | null
          formapgmen?: number | null
          identidade?: string | null
          limcrednissei?: string | null
          localtrab?: number | null
          matnoipe?: string | null
          matrfunc?: string | null
          matricula: number
          motcanc?: number | null
          nome?: string | null
          nomemae?: string | null
          numero?: string | null
          orgemi?: string | null
          pispasep?: string | null
          serie?: string | null
          sexo?: string | null
          siglacadastro?: string | null
          siglamovimentacao?: string | null
          sitdrogamed?: string | null
          sitecco?: string | null
          sitfarmaline?: string | null
          sitgolden?: string | null
          sitnissei?: string | null
          situacao?: number | null
          telefone?: string | null
          telefone1?: string | null
          telefone2?: string | null
          tipacomoda?: number | null
          tipofunc?: string | null
          tipoplano?: number | null
          uf?: string | null
        }
        Update: {
          agencia?: string | null
          bairro?: string | null
          banco?: string | null
          cargo?: number | null
          cartprof?: string | null
          cep?: number | null
          cidade?: string | null
          codunimed?: string | null
          complemento?: string | null
          contacorr?: string | null
          cpf?: number | null
          datacadastro?: string | null
          datamovimentacao?: string | null
          ddd?: string | null
          ddd1?: string | null
          ddd2?: string | null
          dtbaseecco?: string | null
          dtbaseplano?: string | null
          dtbasesit?: string | null
          dtemirg?: string | null
          dtnasc?: string | null
          email?: string | null
          empresa?: number | null
          endereco?: string | null
          estcivil?: number | null
          faixaetaria?: number | null
          formapgmen?: number | null
          identidade?: string | null
          limcrednissei?: string | null
          localtrab?: number | null
          matnoipe?: string | null
          matrfunc?: string | null
          matricula?: number
          motcanc?: number | null
          nome?: string | null
          nomemae?: string | null
          numero?: string | null
          orgemi?: string | null
          pispasep?: string | null
          serie?: string | null
          sexo?: string | null
          siglacadastro?: string | null
          siglamovimentacao?: string | null
          sitdrogamed?: string | null
          sitecco?: string | null
          sitfarmaline?: string | null
          sitgolden?: string | null
          sitnissei?: string | null
          situacao?: number | null
          telefone?: string | null
          telefone1?: string | null
          telefone2?: string | null
          tipacomoda?: number | null
          tipofunc?: string | null
          tipoplano?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      caddep: {
        Row: {
          codunimed: string | null
          cpf: string | null
          datacadastro: string | null
          datamovimentacao: string | null
          dtbaseecco: string | null
          dtbasesit: string | null
          dtemirg: string | null
          dtnasc: string | null
          dtvalid: string | null
          email: string | null
          faixaetaria: number | null
          identidade: string | null
          matricula: number
          motcanc: number | null
          nome: string | null
          nomemae: string | null
          nrodep: number | null
          orgemi: string | null
          parent: number | null
          sexo: string | null
          siglacadastro: string | null
          siglamovimentacao: string | null
          sitecco: string | null
          sitgolden: string | null
          situacao: number | null
          tipacomoda: string | null
        }
        Insert: {
          codunimed?: string | null
          cpf?: string | null
          datacadastro?: string | null
          datamovimentacao?: string | null
          dtbaseecco?: string | null
          dtbasesit?: string | null
          dtemirg?: string | null
          dtnasc?: string | null
          dtvalid?: string | null
          email?: string | null
          faixaetaria?: number | null
          identidade?: string | null
          matricula: number
          motcanc?: number | null
          nome?: string | null
          nomemae?: string | null
          nrodep?: number | null
          orgemi?: string | null
          parent?: number | null
          sexo?: string | null
          siglacadastro?: string | null
          siglamovimentacao?: string | null
          sitecco?: string | null
          sitgolden?: string | null
          situacao?: number | null
          tipacomoda?: string | null
        }
        Update: {
          codunimed?: string | null
          cpf?: string | null
          datacadastro?: string | null
          datamovimentacao?: string | null
          dtbaseecco?: string | null
          dtbasesit?: string | null
          dtemirg?: string | null
          dtnasc?: string | null
          dtvalid?: string | null
          email?: string | null
          faixaetaria?: number | null
          identidade?: string | null
          matricula?: number
          motcanc?: number | null
          nome?: string | null
          nomemae?: string | null
          nrodep?: number | null
          orgemi?: string | null
          parent?: number | null
          sexo?: string | null
          siglacadastro?: string | null
          siglamovimentacao?: string | null
          sitecco?: string | null
          sitgolden?: string | null
          situacao?: number | null
          tipacomoda?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_caddep_parent_tabgrpar"
            columns: ["parent"]
            isOneToOne: false
            referencedRelation: "tabgrpar"
            referencedColumns: ["codigo"]
          },
        ]
      }
      irpfd: {
        Row: {
          ano: number | null
          matricula: number | null
          nrodep: string | null
          vlguia: number | null
          vlmen: number | null
        }
        Insert: {
          ano?: number | null
          matricula?: number | null
          nrodep?: string | null
          vlguia?: number | null
          vlmen?: number | null
        }
        Update: {
          ano?: number | null
          matricula?: number | null
          nrodep?: string | null
          vlguia?: number | null
          vlmen?: number | null
        }
        Relationships: []
      }
      irpfdb: {
        Row: {
          ano: number | null
          matricula: number | null
          nrodep: string | null
          vlguia: number | null
          vlmen: number | null
        }
        Insert: {
          ano?: number | null
          matricula?: number | null
          nrodep?: string | null
          vlguia?: number | null
          vlmen?: number | null
        }
        Update: {
          ano?: number | null
          matricula?: number | null
          nrodep?: string | null
          vlguia?: number | null
          vlmen?: number | null
        }
        Relationships: []
      }
      irpft: {
        Row: {
          ano: number | null
          guiaboleto: string | null
          guiat: number | null
          matricula: number | null
          ment: number | null
          nrodep: string | null
          vlecco: string | null
        }
        Insert: {
          ano?: number | null
          guiaboleto?: string | null
          guiat?: number | null
          matricula?: number | null
          ment?: number | null
          nrodep?: string | null
          vlecco?: string | null
        }
        Update: {
          ano?: number | null
          guiaboleto?: string | null
          guiat?: number | null
          matricula?: number | null
          ment?: number | null
          nrodep?: string | null
          vlecco?: string | null
        }
        Relationships: []
      }
      irpftb: {
        Row: {
          ano: number | null
          guiaboleto: string | null
          guiat: number | null
          matricula: number | null
          ment: string | null
          nrodep: string | null
          vlecco: string | null
        }
        Insert: {
          ano?: number | null
          guiaboleto?: string | null
          guiat?: number | null
          matricula?: number | null
          ment?: string | null
          nrodep?: string | null
          vlecco?: string | null
        }
        Update: {
          ano?: number | null
          guiaboleto?: string | null
          guiat?: number | null
          matricula?: number | null
          ment?: string | null
          nrodep?: string | null
          vlecco?: string | null
        }
        Relationships: []
      }
      mgumrr: {
        Row: {
          datareceb: string | null
          datavenc: string | null
          dep: string | null
          dtatend: string | null
          evento: string | null
          forreceb: number | null
          guia: number | null
          matricula: number | null
          parcela: number | null
          prsv: number | null
          tipo: string | null
          tipreceb: number | null
          titulo: number | null
          valorpago: number | null
          valorpart: number | null
          valorreceb: number | null
          valortit: number | null
        }
        Insert: {
          datareceb?: string | null
          datavenc?: string | null
          dep?: string | null
          dtatend?: string | null
          evento?: string | null
          forreceb?: number | null
          guia?: number | null
          matricula?: number | null
          parcela?: number | null
          prsv?: number | null
          tipo?: string | null
          tipreceb?: number | null
          titulo?: number | null
          valorpago?: number | null
          valorpart?: number | null
          valorreceb?: number | null
          valortit?: number | null
        }
        Update: {
          datareceb?: string | null
          datavenc?: string | null
          dep?: string | null
          dtatend?: string | null
          evento?: string | null
          forreceb?: number | null
          guia?: number | null
          matricula?: number | null
          parcela?: number | null
          prsv?: number | null
          tipo?: string | null
          tipreceb?: number | null
          titulo?: number | null
          valorpago?: number | null
          valorpart?: number | null
          valorreceb?: number | null
          valortit?: number | null
        }
        Relationships: []
      }
      mgumrrapg: {
        Row: {
          datareceb: string | null
          datavenc: string | null
          dep: string | null
          dtatend: string | null
          evento: string | null
          forreceb: number | null
          guia: number | null
          matricula: number | null
          parcela: number | null
          prsv: number | null
          tipo: string | null
          tipreceb: number | null
          titulo: number | null
          valorpago: number | null
          valorpart: number | null
          valorreceb: number | null
          valortit: number | null
        }
        Insert: {
          datareceb?: string | null
          datavenc?: string | null
          dep?: string | null
          dtatend?: string | null
          evento?: string | null
          forreceb?: number | null
          guia?: number | null
          matricula?: number | null
          parcela?: number | null
          prsv?: number | null
          tipo?: string | null
          tipreceb?: number | null
          titulo?: number | null
          valorpago?: number | null
          valorpart?: number | null
          valorreceb?: number | null
          valortit?: number | null
        }
        Update: {
          datareceb?: string | null
          datavenc?: string | null
          dep?: string | null
          dtatend?: string | null
          evento?: string | null
          forreceb?: number | null
          guia?: number | null
          matricula?: number | null
          parcela?: number | null
          prsv?: number | null
          tipo?: string | null
          tipreceb?: number | null
          titulo?: number | null
          valorpago?: number | null
          valorpart?: number | null
          valorreceb?: number | null
          valortit?: number | null
        }
        Relationships: []
      }
      noticias: {
        Row: {
          autor_sigla: string
          categoria: string
          conteudo: string
          created_at: string
          data_publicacao: string | null
          id: string
          imagem_url: string | null
          publicado: boolean
          resumo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_sigla: string
          categoria: string
          conteudo: string
          created_at?: string
          data_publicacao?: string | null
          id?: string
          imagem_url?: string | null
          publicado?: boolean
          resumo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_sigla?: string
          categoria?: string
          conteudo?: string
          created_at?: string
          data_publicacao?: string | null
          id?: string
          imagem_url?: string | null
          publicado?: boolean
          resumo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_change_logs: {
        Row: {
          id: string
          matricula: number
          cpf: string | null
          nome_associado: string | null
          email_anterior: string | null
          email_novo: string
          alterado_por_sigla: string
          alterado_por_nome: string | null
          motivo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          matricula: number
          cpf?: string | null
          nome_associado?: string | null
          email_anterior?: string | null
          email_novo: string
          alterado_por_sigla: string
          alterado_por_nome?: string | null
          motivo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          matricula?: number
          cpf?: string | null
          nome_associado?: string | null
          email_anterior?: string | null
          email_novo?: string
          alterado_por_sigla?: string
          alterado_por_nome?: string | null
          motivo?: string | null
          created_at?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          id: string
          token: string
          cpf_or_email: string
          matricula: number | null
          used: boolean
          expires_at: string
          created_at: string
          used_at: string | null
          created_by_sigla: string | null
          request_ip: string | null
        }
        Insert: {
          id?: string
          token: string
          cpf_or_email: string
          matricula?: number | null
          used?: boolean
          expires_at: string
          created_at?: string
          used_at?: string | null
          created_by_sigla?: string | null
          request_ip?: string | null
        }
        Update: {
          id?: string
          token?: string
          cpf_or_email?: string
          matricula?: number | null
          used?: boolean
          expires_at?: string
          created_at?: string
          used_at?: string | null
          created_by_sigla?: string | null
          request_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_matricula_fkey"
            columns: ["matricula"]
            isOneToOne: false
            referencedRelation: "cadben"
            referencedColumns: ["matricula"]
          },
        ]
      }
      relatorio_tokens: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          filename: string
          gerado_em: string
          gerado_por_matricula: number | null
          gerado_por_sigla: string | null
          html_content: string
          id: string
          matricula: number
          tipo_relatorio: string
          token: string
          ultima_visualizacao: string | null
          visualizacoes: number
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          filename: string
          gerado_em?: string
          gerado_por_matricula?: number | null
          gerado_por_sigla?: string | null
          html_content: string
          id?: string
          matricula: number
          tipo_relatorio: string
          token: string
          ultima_visualizacao?: string | null
          visualizacoes?: number
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          filename?: string
          gerado_em?: string
          gerado_por_matricula?: number | null
          gerado_por_sigla?: string | null
          html_content?: string
          id?: string
          matricula?: number
          tipo_relatorio?: string
          token?: string
          ultima_visualizacao?: string | null
          visualizacoes?: number
        }
        Relationships: []
      }
      requerimentos: {
        Row: {
          created_at: string
          dados: Json
          documentos: Json | null
          email: string
          id: string
          matricula: number
          nome_solicitante: string
          observacoes_admin: string | null
          respondido_em: string | null
          respondido_por_sigla: string | null
          status: string
          telefone: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dados: Json
          documentos?: Json | null
          email: string
          id?: string
          matricula: number
          nome_solicitante: string
          observacoes_admin?: string | null
          respondido_em?: string | null
          respondido_por_sigla?: string | null
          status?: string
          telefone?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dados?: Json
          documentos?: Json | null
          email?: string
          id?: string
          matricula?: number
          nome_solicitante?: string
          observacoes_admin?: string | null
          respondido_em?: string | null
          respondido_por_sigla?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          awaiting_party: string | null
          created_by_sigla: string | null
          cpf: string
          created_at: string
          data_nascimento: string
          email: string
          feedback_interno: string | null
          id: string
          last_interaction_at: string | null
          last_sender_sigla: string | null
          last_sender_tipo: string | null
          matricula: number | null
          matricula_desconhecida: boolean
          mensagem: string
          nome: string
          origem: string
          respondido_em: string | null
          respondido_por_cargo: string | null
          respondido_por_sigla: string | null
          status: string
          target_matricula: number | null
          target_sigla: string | null
          target_type: string
          telefone: string
          updated_at: string
        }
        Insert: {
          awaiting_party?: string | null
          created_by_sigla?: string | null
          cpf: string
          created_at?: string
          data_nascimento: string
          email: string
          feedback_interno?: string | null
          id?: string
          last_interaction_at?: string | null
          last_sender_sigla?: string | null
          last_sender_tipo?: string | null
          matricula?: number | null
          matricula_desconhecida?: boolean
          mensagem: string
          nome: string
          origem?: string
          respondido_em?: string | null
          respondido_por_cargo?: string | null
          respondido_por_sigla?: string | null
          status?: string
          target_matricula?: number | null
          target_sigla?: string | null
          target_type?: string
          telefone: string
          updated_at?: string
        }
        Update: {
          awaiting_party?: string | null
          created_by_sigla?: string | null
          cpf?: string
          created_at?: string
          data_nascimento?: string
          email?: string
          feedback_interno?: string | null
          id?: string
          last_interaction_at?: string | null
          last_sender_sigla?: string | null
          last_sender_tipo?: string | null
          matricula?: number | null
          matricula_desconhecida?: boolean
          mensagem?: string
          nome?: string
          origem?: string
          respondido_em?: string | null
          respondido_por_cargo?: string | null
          respondido_por_sigla?: string | null
          status?: string
          target_matricula?: number | null
          target_sigla?: string | null
          target_type?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_message_replies: {
        Row: {
          created_at: string
          id: string
          mensagem: string
          sender_nome: string | null
          sender_sigla: string | null
          sender_tipo: string
          support_message_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem: string
          sender_nome?: string | null
          sender_sigla?: string | null
          sender_tipo: string
          support_message_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mensagem?: string
          sender_nome?: string | null
          sender_sigla?: string | null
          sender_tipo?: string
          support_message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_message_replies_support_message_id_fkey"
            columns: ["support_message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      senhas: {
        Row: {
          cpf: string
          created_at: string
          created_by_sigla: string | null
          id: string
          matricula: number | null
          nome: string | null
          senha: string
          updated_at: string
        }
        Insert: {
          cpf: string
          created_at?: string
          created_by_sigla?: string | null
          id?: string
          matricula?: number | null
          nome?: string | null
          senha: string
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          created_by_sigla?: string | null
          id?: string
          matricula?: number | null
          nome?: string | null
          senha?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_senhas_matricula"
            columns: ["matricula"]
            isOneToOne: false
            referencedRelation: "cadben"
            referencedColumns: ["matricula"]
          },
        ]
      }
      sobre_funsep: {
        Row: {
          atualizado_por_sigla: string | null
          conteudo: string
          created_at: string
          id: string
          ordem: number
          publicado: boolean
          slug: string
          titulo: string
          updated_at: string
        }
        Insert: {
          atualizado_por_sigla?: string | null
          conteudo: string
          created_at?: string
          id?: string
          ordem: number
          publicado?: boolean
          slug: string
          titulo: string
          updated_at?: string
        }
        Update: {
          atualizado_por_sigla?: string | null
          conteudo?: string
          created_at?: string
          id?: string
          ordem?: number
          publicado?: boolean
          slug?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      tabbeneficios: {
        Row: {
          classe: string | null
          codigo: string | null
          id: number
          nome: string | null
          unidvlr: string | null
          vlrbenef: string | null
        }
        Insert: {
          classe?: string | null
          codigo?: string | null
          id?: number
          nome?: string | null
          unidvlr?: string | null
          vlrbenef?: string | null
        }
        Update: {
          classe?: string | null
          codigo?: string | null
          id?: number
          nome?: string | null
          unidvlr?: string | null
          vlrbenef?: string | null
        }
        Relationships: []
      }
      tabempresas: {
        Row: {
          codigo: number
          nome: string | null
        }
        Insert: {
          codigo: number
          nome?: string | null
        }
        Update: {
          codigo?: number
          nome?: string | null
        }
        Relationships: []
      }
      tabgrpar: {
        Row: {
          codigo: number
          nome: string | null
          tipo: string | null
        }
        Insert: {
          codigo: number
          nome?: string | null
          tipo?: string | null
        }
        Update: {
          codigo?: number
          nome?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          cargo: string | null
          cpf: string | null
          id: number
          nome: string | null
          secao: string
          senha: string | null
          sigla: string | null
          status: string | null
          telefone: string | null
        }
        Insert: {
          cargo?: string | null
          cpf?: string | null
          id?: number
          nome?: string | null
          secao: string
          senha?: string | null
          sigla?: string | null
          status?: string | null
          telefone?: string | null
        }
        Update: {
          cargo?: string | null
          cpf?: string | null
          id?: number
          nome?: string | null
          secao?: string
          senha?: string | null
          sigla?: string | null
          status?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convert_text_to_html_v2: {
        Args: { text_content: string }
        Returns: string
      }
      current_user_is_admin: { Args: never; Returns: boolean }
      get_current_admin_sigla: { Args: never; Returns: string }
      get_current_admin_token: { Args: never; Returns: string }
      has_active_admin_session: { Args: never; Returns: boolean }
      is_active_session: { Args: { _sigla: string }; Returns: boolean }
      is_admin_session: { Args: { _sigla: string }; Returns: boolean }
      is_admin_user: { Args: { _sigla: string }; Returns: boolean }
      is_authenticated_admin: { Args: never; Returns: boolean }
      matricula_has_active_session: {
        Args: { _matricula: number }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
