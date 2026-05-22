import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, FileUp, Link2, QrCode, Shield, ShoppingCart, Wallet } from "lucide-react";
import { apiRequest, shortWallet } from "@/lib/api";
import { clearSessionUser, setSessionUser, type SessionUser, type UserRole } from "@/lib/auth";
import { isInactiveNdiError, isInactiveNdiProof } from "@/lib/ndi";

type NDIProof = {
  threadId: string;
  proofRequestURL: string;
  deepLinkURL: string;
  role: UserRole;
  status: "PENDING" | "VERIFIED" | "EXPIRED" | "FAILED";
  expiresAt: string;
  error?: string;
  user?: SessionUser | null;
};

const Login = () => {
  const navigate = useNavigate();
  const [proof, setProof] = useState<NDIProof | null>(null);
  const [issuedUser, setIssuedUser] = useState<SessionUser | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const qrImage = useMemo(() => {
    if (!proof?.proofRequestURL) {
      return "";
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(proof.proofRequestURL)}`;
  }, [proof?.proofRequestURL]);

  useEffect(() => {
    if (!proof || proof.status !== "PENDING") {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const data = await apiRequest<NDIProof>(`/api/auth/ndi/status/${proof.threadId}`);
        if (isInactiveNdiProof(data)) {
          setProof(null);
          setMessage("");
          return;
        }

        setProof(data);

        if (data.status === "VERIFIED" && data.user) {
          const userSession = { ...data.user, role: "user" as UserRole };
          setIssuedUser(userSession);
          setSessionUser(userSession);
          setMessage(`Platform wallet ready: ${shortWallet(userSession.walletAddress)}.`);
          window.setTimeout(() => navigate("/user-dashboard"), 700);
          return;
        }

        if (data.status === "FAILED") {
          setMessage(data.error || "NDI login could not be completed.");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "";
        if (isInactiveNdiError(errorMessage)) {
          setProof(null);
          setMessage("");
          return;
        }

        setMessage("Unable to check NDI login status.");
      }
    }, 1800);

    return () => window.clearInterval(interval);
  }, [navigate, proof]);

  const beginProof = async () => {
    setBusy(true);
    setMessage("");
    setIssuedUser(null);
    clearSessionUser();

    try {
      const data = await apiRequest<NDIProof>("/api/auth/ndi/start", {
        method: "POST",
        body: JSON.stringify({ role: "user" }),
      });
      setProof(data);
      setMessage("Login request created. Approve it in Bhutan NDI Wallet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start NDI login.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border border-primary bg-primary p-8 text-white shadow-sm">
            <div>
              <div className="inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                <Shield size={12} />
                Citizen NDI access
              </div>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">
                Verify identity for digital property services.
              </h1>
              <p className="mt-4 max-w-lg text-white/80">
                Sign in with Bhutan NDI to submit property records, view approved registry listings, manage ownership shares, and record leases.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  icon={ShoppingCart}
                  title="Registry access"
                  description="View approved records and ownership share availability."
                />
                <InfoCard
                  icon={FileUp}
                  title="Property submission"
                  description="Upload encrypted documents for officer review."
                />
              </div>
            </div>
          </div>

          <div className="border border-border border-t-4 border-t-gold bg-card/95 p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-sm bg-gold/10 p-3 text-gold">
                {issuedUser ? <Wallet size={22} /> : <QrCode size={22} />}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{issuedUser ? "Citizen session verified" : "Login with NDI"}</h2>
                <p className="text-sm text-muted-foreground">
                  {issuedUser ? "Opening your service workspace." : "Scan with Bhutan NDI Wallet and approve the login request."}
                </p>
              </div>
            </div>

            {!proof && (
              <div className="mt-8 border border-border/80 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Service access</div>
                <div className="mt-2 text-3xl font-bold">One verified citizen session</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  A verified session can submit property documents, review public registry records, purchase approved shares, and manage lease records.
                </p>
                <button
                  type="button"
                  onClick={() => void beginProof()}
                  disabled={busy}
                  className="mt-6 inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:bg-gold-light disabled:opacity-60"
                >
                  {busy ? "Creating..." : "Login with NDI"}
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {proof && proof.status === "PENDING" && !issuedUser && (
              <div className="mt-8 grid gap-6 md:grid-cols-[240px_1fr]">
                <div className="border border-border bg-background p-4">
                  {qrImage ? (
                    <img src={qrImage} alt="NDI login QR code" className="mx-auto h-[220px] w-[220px] rounded-sm bg-white p-2" />
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">Preparing QR...</div>
                  )}
                </div>
                <div className="border border-border/80 bg-white p-5">
                  <div className="inline-flex items-center gap-2 rounded-sm border border-gold/25 bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                    <Clock size={12} />
                    Waiting for NDI approval
                  </div>
                  <p className="mt-4 break-all text-sm text-muted-foreground">Thread ID: {proof.threadId}</p>
                  <p className="mt-3 text-sm text-muted-foreground">Once approved, the platform will create your secure wallet automatically.</p>
                  <a
                    href={proof.deepLinkURL}
                    className="mt-5 inline-flex items-center gap-2 rounded-sm border border-gold/40 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-gold hover:bg-gold/10"
                  >
                    <Link2 size={16} />
                    Open NDI Wallet
                  </a>
                </div>
              </div>
            )}

            {issuedUser && (
              <div className="mt-8 border border-border/80 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">NDI verified</div>
                <div className="mt-3 break-all text-sm text-muted-foreground">Holder DID: {issuedUser.holderDid}</div>
                <div className="mt-1 text-sm text-muted-foreground">Display ID: {issuedUser.idNumberDisplay}</div>
                <div className="mt-1 text-sm text-muted-foreground">Platform wallet: {shortWallet(issuedUser.walletAddress)}</div>
              </div>
            )}

            {proof?.status === "FAILED" && !issuedUser && !isInactiveNdiProof(proof) && (
              <div className="mt-8 border border-border/80 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Login not completed</div>
                <p className="mt-3 text-sm text-muted-foreground">{proof.error || "The NDI login could not be completed."}</p>
                <button
                  type="button"
                  onClick={() => {
                    setProof(null);
                    setMessage("");
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground hover:bg-gold-light"
                >
                  Try again
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {message && <p className="mt-5 border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">{message}</p>}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;

const InfoCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShoppingCart;
  title: string;
  description: string;
}) => (
  <div className="rounded-sm border border-white/15 bg-white/10 p-4 text-left text-white">
    <Icon size={18} className="text-gold" />
    <div className="mt-3 font-semibold">{title}</div>
    <div className="mt-1 text-sm text-white/75">{description}</div>
  </div>
);
