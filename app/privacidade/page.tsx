import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidade",
  description:
    "Como o DevToolbox trata seus dados: ferramentas no navegador, APIs de rede e uso de IA no Cloudflare.",
};

export default function PrivacidadePage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Privacidade</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        O DevToolbox foi feito para desenvolvedores que precisam de ferramentas rápidas sem
        criar conta. Esta página resume o que acontece com seus dados.
      </p>

      <section className="space-y-4 text-sm text-muted-foreground">
        <div>
          <h2 className="text-foreground font-semibold mb-1">Ferramentas no navegador</h2>
          <p>
            JSON, hash, secrets, JWT, senhas, UUID, cores, diff, markdown, cron, timestamp,
            YAML, .env, bases numéricas e outras ferramentas client-side processam tudo
            localmente no seu browser. O conteúdo que você cola não é enviado aos nossos
            servidores para essas funções.
          </p>
        </div>

        <div>
          <h2 className="text-foreground font-semibold mb-1">APIs no servidor (Cloudflare)</h2>
          <p>
            DNS Check, HTTP Headers e recursos de IA fazem requisições ao Worker na Cloudflare.
            Para DNS e Headers, enviamos apenas o domínio ou URL informados. Endereços
            privados são bloqueados. Há limite de taxa por IP.
          </p>
        </div>

        <div>
          <h2 className="text-foreground font-semibold mb-1">Inteligência artificial</h2>
          <p>
            Explicações e revisão de código usam Cloudflare Workers AI (Llama). Não envie
            segredos de produção ou dados pessoais nesses campos.
          </p>
        </div>

        <div>
          <h2 className="text-foreground font-semibold mb-1">Armazenamento local</h2>
          <p>Usamos localStorage para tema e favoritos. Sem cookies de rastreamento invasivos.</p>
        </div>

        <div>
          <h2 className="text-foreground font-semibold mb-1">Código aberto</h2>
          <p>
            O projeto é open source: você pode auditar o código e hospedar sua própria instância.
          </p>
        </div>
      </section>

      <p className="mt-8 text-sm">
        <Link href="/" className="text-primary hover:underline">
          Voltar ao DevToolbox
        </Link>
      </p>
    </div>
  );
}
