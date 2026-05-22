import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Link2, QrCode, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, shortWallet } from "@/lib/api";
import { clearSessionUser, setSessionUser, type SessionUser, type UserRole } from "@/lib/auth";
import { preloadPublicRegistry, preloadWorkspaceData } from "@/lib/dataPreload";
import { isInactiveNdiError, isInactiveNdiProof } from "@/lib/ndi";
import { preloadPage } from "@/lib/routePreload";

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

type NdiLoginMode = "user" | "admin";

type NdiLoginDialogProps = {
  mode: NdiLoginMode;
  onModeChange: (mode: NdiLoginMode) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const modeCopy = {
  user: {
    eyebrow: "Citizen NDI Access",
    title: "Login with NDI",
    description: "Scan with Bhutan NDI Wallet to access digital property services.",
    startBody: { role: "user" },
    verifiedMessage: "Citizen verified. Opening your service workspace...",
    target: "/user-dashboard",
  },
  admin: {
    eyebrow: "Restricted Officer Access",
    title: "Officer NDI Login",
    description: "Scan with Bhutan NDI Wallet. The server will check the officer allowlist.",
    startBody: { intent: "admin" },
    verifiedMessage: "Officer verified. Opening admin console...",
    target: "/admin-dashboard",
  },
} satisfies Record<NdiLoginMode, { description: string; eyebrow: string; startBody: Record<string, string>; target: string; title: string; verifiedMessage: string }>;

const NdiLoginDialog = ({ mode, onModeChange, onOpenChange, open }: NdiLoginDialogProps) => {
  const navigate = useNavigate();
  const [proof, setProof] = useState<NDIProof | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const copy = modeCopy[mode];
  const isAdmin = mode === "admin";

  const preloadForMode = useCallback((nextMode: NdiLoginMode) => {
    preloadPage(nextMode === "admin" ? "adminDashboard" : "userDashboard");

    if (nextMode === "user") {
      preloadPublicRegistry();
    }
  }, []);

  const qrImage = useMemo(() => {
    if (!proof?.proofRequestURL) {
      return "";
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(proof.proofRequestURL)}`;
  }, [proof?.proofRequestURL]);

  useEffect(() => {
    if (!open) {
      setProof(null);
      setMessage("");
      setBusy(false);
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open || !proof || proof.status !== "PENDING") {
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
          if (isAdmin && data.user.role !== "admin") {
            setMessage("This NDI identity is not approved for officer access.");
            return;
          }

          const userSession = isAdmin ? data.user : { ...data.user, role: "user" as UserRole };
          setSessionUser(userSession);
          preloadForMode(userSession.role === "admin" ? "admin" : "user");
          void preloadWorkspaceData(userSession);
          setMessage(copy.verifiedMessage);
          window.setTimeout(() => {
            onOpenChange(false);
            navigate(copy.target);
          }, 650);
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
  }, [copy.target, copy.verifiedMessage, isAdmin, navigate, onOpenChange, open, preloadForMode, proof]);

  const beginProof = async () => {
    setBusy(true);
    setMessage("");
    setProof(null);
    clearSessionUser();
    preloadForMode(mode);

    try {
      const data = await apiRequest<NDIProof>("/api/auth/ndi/start", {
        method: "POST",
        body: JSON.stringify(copy.startBody),
      });
      setProof(data);
      setMessage("Login request created. Approve it in Bhutan NDI Wallet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start NDI login.");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (nextMode: NdiLoginMode) => {
    setProof(null);
    setMessage("");
    preloadForMode(nextMode);
    onModeChange(nextMode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto rounded-sm border-t-4 border-t-gold p-0 sm:rounded-sm">
        <div className="border-b border-border bg-primary px-6 py-4 text-white">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{copy.eyebrow}</div>
          <DialogHeader className="mt-2 text-left">
            <DialogTitle className="text-2xl font-extrabold text-white">{copy.title}</DialogTitle>
            <DialogDescription className="text-sm text-white/75">{copy.description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-2 border border-border text-sm font-bold uppercase tracking-wide">
            <button
              type="button"
              onClick={() => switchMode("user")}
              className={`px-3 py-3 ${!isAdmin ? "bg-primary text-white" : "bg-white text-primary hover:bg-background"}`}
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => switchMode("admin")}
              className={`border-l border-border px-3 py-3 ${isAdmin ? "bg-primary text-white" : "bg-white text-primary hover:bg-background"}`}
            >
              Officer
            </button>
          </div>

          {!proof && (
            <div className="border border-border bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-gold/10 text-gold-dark">
                  <QrCode size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">Simple NDI login</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Start the request, approve it in Bhutan NDI Wallet, and this portal will open the correct workspace.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void beginProof()}
                disabled={busy}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#173b4d] disabled:opacity-60"
              >
                {busy ? "Creating request..." : "Login with NDI"}
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {proof?.status === "PENDING" && (
            <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
              <div className="border border-border bg-background p-3">
                {qrImage ? (
                  <img src={qrImage} alt="NDI login QR code" className="mx-auto h-[200px] w-[200px] bg-white p-2" />
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Preparing QR...</div>
                )}
              </div>
              <div className="border border-border bg-white p-4">
                <div className="inline-flex items-center gap-2 rounded-sm border border-gold/25 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold-dark">
                  <Clock size={12} />
                  Waiting for approval
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Approve the request in Bhutan NDI Wallet. The portal will continue automatically after verification.
                </p>
                <p className="mt-3 break-all text-xs text-muted-foreground">Thread ID: {proof.threadId}</p>
                <a
                  href={proof.deepLinkURL}
                  className="mt-5 inline-flex items-center gap-2 rounded-sm border border-primary/20 px-4 py-3 text-sm font-bold uppercase tracking-wide text-primary hover:border-gold-dark hover:text-[#7a1f2f]"
                >
                  <Link2 size={16} />
                  Open NDI Wallet
                </a>
              </div>
            </div>
          )}

          {proof?.status === "VERIFIED" && proof.user && (
            <div className="border border-emerald-700/20 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck size={16} />
                NDI verified
              </div>
              <p className="mt-2">Wallet: {shortWallet(proof.user.walletAddress)}</p>
            </div>
          )}

          {proof?.status === "FAILED" && !isInactiveNdiProof(proof) && (
            <div className="border border-[#7a1f2f]/20 bg-[#fff7f8] p-4 text-sm text-[#7a1f2f]">
              {proof.error || "NDI login could not be completed."}
            </div>
          )}

          {message && <p className="border border-border bg-background px-4 py-3 text-sm text-muted-foreground">{message}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NdiLoginDialog;
