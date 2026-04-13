import { NextResponse } from "next/server";
import { createClient as createUserClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function DELETE() {
  try {
    const supabase = await createUserClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY não configurada." },
        { status: 500 }
      );
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Apague dados vinculados ao usuário em todas as tabelas,
    // respeitando a ordem de dependência (filhas antes de pais).

    await admin.from("rv_lancamento_itens").delete().eq("user_id", user.id);
    await admin.from("rv_lancamento_custos").delete().eq("user_id", user.id);
    await admin.from("rv_transferencias").delete().eq("user_id", user.id);
    await admin.from("rv_lancamentos").delete().eq("user_id", user.id);
    await admin.from("rv_contas").delete().eq("user_id", user.id);
    await admin.from("rv_insumos").delete().eq("user_id", user.id);
    await admin.from("rv_categorias_custo").delete().eq("user_id", user.id);
    await admin.from("rv_configuracoes").delete().eq("user_id", user.id);
    await admin.from("rv_perfis").delete().eq("user_id", user.id);
    await admin.from("faturas_pagamento").delete().eq("user_id", user.id);
    await admin.from("pagamentos_contas").delete().eq("user_id", user.id);
    await admin.from("movimentacoes_categorias").delete().eq("user_id", user.id);
    await admin.from("movimentacoes").delete().eq("user_id", user.id);
    await admin.from("cartoes").delete().eq("user_id", user.id);
    await admin.from("contas_fixas").delete().eq("user_id", user.id);
    await admin.from("meta_aportes").delete().eq("user_id", user.id);
    await admin.from("metas").delete().eq("user_id", user.id);

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      return NextResponse.json(
        { error: "Não foi possível excluir a conta do usuário." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao excluir conta." },
      { status: 500 }
    );
  }
}