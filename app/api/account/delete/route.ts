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

    // Apague aqui dados vinculados ao usuário, se necessário.
    // Se suas tabelas já usam user_id + cascade em relações internas,
    // estes deletes ajudam a limpar a base antes de remover o auth user.

    await admin.from("meta_aportes").delete().eq("user_id", user.id);
    await admin.from("metas").delete().eq("user_id", user.id);

    // Adicione aqui outras tabelas do seu app, se existirem:
    // await admin.from("movimentacoes").delete().eq("user_id", user.id);
    // await admin.from("cartoes").delete().eq("user_id", user.id);
    // await admin.from("contas").delete().eq("user_id", user.id);

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      return NextResponse.json(
        { error: "Não foi possível excluir a conta do usuário." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir conta." },
      { status: 500 }
    );
  }
}