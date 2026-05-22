import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Landmark, Link2, LockKeyhole, QrCode, ShieldCheck, UserCheck } from "lucide-react";
import { apiRequest, shortWallet } from "@/lib/api";
import { clearSessionUser, setSessionUser, type SessionUser, type UserRole } from "@/lib/auth";
import { isInactiveNdiError, isInactiveNdiProof } from "@/lib/ndi";

type NDIProof = {
  threadId: string;
  proofRequestURL: string;
  deepLinkURL: string;
  role: UserRole;
  intent?: "user" | "admin";
  status: "PENDING" | "VERIFIED" | "EXPIRED" | "FAILED";
  expiresAt: string;
  error?: string;
  user?: SessionUser | null;
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const [proof, setProof] = useState<NDIProof | null>(null);
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
          if (data.user.role !== "admin") {
            setMessage("This NDI identity is not approved for admin console access.");
            return;
          }

          setSessionUser(data.user);
          setMessage("Officer verified. Opening admin console...");
          navigate("/admin-dashboard");
          return;
        }

        if (data.status === "FAILED") {
          setMessage(data.error || "This NDI identity is not approved for admin console access.");
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
    clearSessionUser();

    try {
      const data = await apiRequest<NDIProof>("/api/auth/ndi/start", {
        method: "POST",
        body: JSON.stringify({ intent: "admin" }),
      });
      setProof(data);
      setMessage("Login request created. Approve it in Bhutan NDI Wallet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start admin NDI login.");
    } finally {
      setBusy(false);
    }
  };

  const approvedUser = proof?.status === "VERIFIED" && proof.user?.role === "admin" ? proof.user : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="border border-primary bg-primary p-8 text-white shadow-sm">
            <div>
              <div className="inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                <LockKeyhole size={12} />
                Restricted Officer Access
              </div>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">
                Officer verification for property service administration.
              </h1>
              <p className="mt-4 max-w-lg text-white/80">
                Administrative actions require Bhutan NDI verification against a backend officer allowlist. No browser wallet signature is needed.
              </p>

              <div className="mt-8 grid gap-4">
                <AdminStep icon={Landmark} title="1. Login with NDI" description="Confirm the officer session with Bhutan NDI before any admin action." />
                <AdminStep icon={UserCheck} title="2. Check officer allowlist" description="The backend authorizes approved NDI identities from environment configuration." />
                <AdminStep icon={ShieldCheck} title="3. Audit every action" description="Approvals, rejections, wallet suspensions, and lease events are logged." />
              </div>
            </div>
          </div>

          <div className="border border-border border-t-4 border-t-gold bg-card/95 p-8 text-card-foreground shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-sm bg-gold/10 p-3 text-gold">
                {approvedUser ? <ShieldCheck size={22} /> : <QrCode size={22} />}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{approvedUser ? "Officer authorized" : "Officer NDI login"}</h2>
                <p className="text-sm text-muted-foreground">
                  {approvedUser ? "The backend approved this officer session." : "Scan with Bhutan NDI Wallet and approve the login request."}
                </p>
              </div>
            </div>

            {!proof && (
              <div className="mt-8 border border-border/80 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Secure console access</div>
                <div className="mt-2 text-3xl font-bold">Verify before administration</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start by proving identity through Bhutan NDI. The server checks the verified holder against the approved officer allowlist.
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

            {proof && proof.status === "PENDING" && (
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
                  <p className="mt-4 text-sm text-muted-foreground">The admin console opens automatically after officer authorization.</p>
                  <p className="mt-3 break-all text-xs text-muted-foreground">Thread ID: {proof.threadId}</p>
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

            {approvedUser && (
              <div className="mt-8 border border-border/80 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Authorized officer session</div>
                <div className="mt-3 break-all text-sm text-muted-foreground">Holder DID: {approvedUser.holderDid}</div>
                <div className="mt-1 text-sm text-muted-foreground">Platform wallet: {shortWallet(approvedUser.walletAddress)}</div>
              </div>
            )}

            {proof?.status === "FAILED" && !isInactiveNdiProof(proof) && (
              <div className="mt-8 border border-border/80 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Access not approved</div>
                <p className="mt-3 text-sm text-muted-foreground">{proof.error || "This NDI identity is not approved for admin console access."}</p>
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

            <Link to="/" className="mt-6 inline-flex text-sm font-semibold text-muted-foreground hover:text-gold">
              Return to public site
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminLogin;

const AdminStep = ({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Landmark;
  title: string;
  description: string;
}) => (
  <div className="rounded-sm border border-white/15 bg-white/10 p-4 text-white">
    <Icon size={18} className="text-gold" />
    <div className="mt-3 font-semibold">{title}</div>
    <div className="mt-1 text-sm text-white/75">{description}</div>
  </div>
);
