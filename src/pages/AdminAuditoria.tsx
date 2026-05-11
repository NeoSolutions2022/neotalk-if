import { useMemo, useState } from 'react';
import { CheckCircle2, Ticket, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuditReceipt {
  id: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  detectedValue: number | null;
  suggestedCoupons: number;
  imageUrl: string;
}

const MOCK_RECEIPTS: AuditReceipt[] = [
  {
    id: 'AUD-1001',
    submittedBy: 'Padaria Pão Quente',
    submittedAt: '2026-05-08 10:14',
    status: 'pendente',
    detectedValue: null,
    suggestedCoupons: 0,
    imageUrl: 'https://i.imgur.com/tc989yh.jpg',
  },
  {
    id: 'AUD-1002',
    submittedBy: 'Padaria Trigo Feliz',
    submittedAt: '2026-05-08 09:02',
    status: 'pendente',
    detectedValue: 41.5,
    suggestedCoupons: 4,
    imageUrl: 'https://i.imgur.com/tc989yh.jpg',
  },
];

const AdminAuditoria = () => {
  const [receipts, setReceipts] = useState<AuditReceipt[]>(MOCK_RECEIPTS);

  const pendingReceipts = useMemo(() => receipts.filter((r) => r.status === 'pendente'), [receipts]);

  const approveReceipt = (receiptId: string, adminValue: number) => {
    const generatedCoupons = Math.max(1, Math.floor(adminValue / 10));

    setReceipts((current) =>
      current.map((receipt) =>
        receipt.id === receiptId
          ? {
              ...receipt,
              status: 'aprovada',
              detectedValue: adminValue,
              suggestedCoupons: generatedCoupons,
            }
          : receipt,
      ),
    );
  };

  const rejectReceipt = (receiptId: string) => {
    setReceipts((current) =>
      current.map((receipt) =>
        receipt.id === receiptId
          ? {
              ...receipt,
              status: 'rejeitada',
            }
          : receipt,
      ),
    );
  };

  const approvedCount = receipts.filter((r) => r.status === 'aprovada').length;
  const rejectedCount = receipts.filter((r) => r.status === 'rejeitada').length;
  const generatedCoupons = receipts.reduce((sum, receipt) => sum + (receipt.status === 'aprovada' ? receipt.suggestedCoupons : 0), 0);

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold md:text-3xl">Admin • Auditoria de Notas (Mock)</h1>
          <p className="text-muted-foreground">
            Fluxo mockado: usuário envia nota com erro de leitura da IA, admin valida valor real e aprova para gerar cupons.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Pendentes</CardDescription>
              <CardTitle>{pendingReceipts.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Aprovadas</CardDescription>
              <CardTitle className="text-green-600">{approvedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Cupons gerados</CardDescription>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Ticket className="h-5 w-5" /> {generatedCoupons}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="space-y-4">
          {pendingReceipts.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Não há notas pendentes de auditoria no momento.
              </CardContent>
            </Card>
          ) : (
            pendingReceipts.map((receipt) => (
              <Card key={receipt.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{receipt.id}</CardTitle>
                  <CardDescription>
                    Enviado por <strong>{receipt.submittedBy}</strong> em {receipt.submittedAt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-[280px,1fr]">
                    <img
                      src={receipt.imageUrl}
                      alt={`Nota fiscal para auditoria ${receipt.id}`}
                      className="h-56 w-full rounded-md border object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />

                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Valor detectado pela IA:{' '}
                        <span className="font-medium text-foreground">
                          {receipt.detectedValue !== null ? `R$ ${receipt.detectedValue.toFixed(2)}` : 'não identificado'}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ação do admin: confirmar quanto a nota realmente vale e validar se é uma nota válida.
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => approveReceipt(receipt.id, 50)} className="gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Aprovar como R$ 50,00
                        </Button>
                        <Button onClick={() => approveReceipt(receipt.id, 30)} variant="secondary" className="gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Aprovar como R$ 30,00
                        </Button>
                        <Button onClick={() => rejectReceipt(receipt.id)} variant="destructive" className="gap-2">
                          <XCircle className="h-4 w-4" />
                          Rejeitar nota
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>

        <footer className="text-sm text-muted-foreground">Rejeitadas (mock): {rejectedCount}</footer>
      </div>
    </main>
  );
};

export default AdminAuditoria;
