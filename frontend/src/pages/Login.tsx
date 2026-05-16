import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, FileUp, Link2, QrCode, Shield, ShoppingCart, Wallet } from "lucide-react";
import { apiRequest, shortWallet } from "@/lib/api";
import { setSessionUser, type SessionUser, type UserRole } from "@/lib/auth";

type NDIProof = {
  threadId: string;
  proofRequestURL: string;
  deepLinkURL: string;
  role: UserRole;
  status: "PENDING" | "VERIFIED" | "EXPIRED" | "FAILED";
  expiresAt: string;
  user?: SessionUser | null;
};

type WalletChallenge = {
  challengeId: string;
  walletAddress: string;
  challenge: string;
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isCoinbaseWallet?: boolean;
  isBraveWallet?: boolean;
  providers?: EthereumProvider[];
};

type WalletOption = {
  id: string;
  name: string;
  provider: EthereumProvider;
  icon?: string;
};

type Eip6963ProviderDetail = {
  info: {
    uuid: string;
    name: string;
    icon?: string;
    rdns?: string;
  };
  provider: EthereumProvider;
};

const userRole: UserRole = "user";

const getEthereum = (): EthereumProvider | undefined =>
  (window as Window & {
    ethereum?: EthereumProvider;
  }).ethereum;

const getInjectedWalletName = (provider: EthereumProvider, index: number) => {
  if (provider.isRabby) return "Rabby";
  if (provider.isCoinbaseWallet) return "Coinbase Wallet";
  if (provider.isBraveWallet) return "Brave Wallet";
  if (provider.isMetaMask) return "MetaMask";
  return index === 0 ? "Browser Wallet" : `Browser Wallet ${index + 1}`;
};

const getInjectedWalletId = (provider: EthereumProvider, index: number) => {
  if (provider.isRabby) return "injected-rabby";
  if (provider.isCoinbaseWallet) return "injected-coinbase";
  if (provider.isBraveWallet) return "injected-brave";
  if (provider.isMetaMask) return "injected-metamask";
  return `injected-${index}`;
};

const Login = () => {
  const navigate = useNavigate();
  const [proof, setProof] = useState<NDIProof | null>(null);
  const [verifiedUser, setVerifiedUser] = useState<SessionUser | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletOptions, setWalletOptions] = useState<WalletOption[]>([]);
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
        setProof(data);
        if (data.status === "VERIFIED" && data.user) {
          setVerifiedUser(data.user);
          setMessage("NDI proof validated. Link your wallet to continue.");
        }
      } catch {
        setMessage("Unable to poll NDI proof status.");
      }
    }, 1800);

    return () => window.clearInterval(interval);
  }, [proof]);

  useEffect(() => {
    const upsertWallet = (wallet: WalletOption) => {
      setWalletOptions((current) => {
        if (current.some((item) => item.id === wallet.id)) {
          return current.map((item) => (item.id === wallet.id ? wallet : item));
        }
        return [...current, wallet].sort((a, b) => a.name.localeCompare(b.name));
      });
    };

    const handleAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;
      if (!detail?.provider || !detail.info?.uuid) {
        return;
      }

      upsertWallet({
        id: detail.info.rdns || detail.info.uuid,
        name: detail.info.name,
        icon: detail.info.icon,
        provider: detail.provider,
      });
    };

    window.addEventListener("eip6963:announceProvider", handleAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    const ethereum = getEthereum();
    const providers = ethereum?.providers?.length ? ethereum.providers : ethereum ? [ethereum] : [];
    providers.forEach((provider, index) => {
      upsertWallet({
        id: getInjectedWalletId(provider, index),
        name: getInjectedWalletName(provider, index),
        provider,
      });
    });

    return () => window.removeEventListener("eip6963:announceProvider", handleAnnounce);
  }, []);

  const beginProof = async () => {
    setBusy(true);
    setMessage("");
    setVerifiedUser(null);

    try {
      const data = await apiRequest<NDIProof>("/api/auth/ndi/start", {
        method: "POST",
        body: JSON.stringify({ role: userRole }),
      });
      setProof(data);
      setMessage("Proof request created. Approve it in Bhutan NDI Wallet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start NDI login.");
    } finally {
      setBusy(false);
    }
  };

  const verifyWallet = async (address: string, provider: EthereumProvider) => {
    if (!verifiedUser) {
      setMessage("Complete NDI verification before linking a wallet.");
      return;
    }

    const challenge = await apiRequest<WalletChallenge>("/api/wallet/challenge", {
      method: "POST",
      token: verifiedUser.sessionToken,
      body: JSON.stringify({ sessionToken: verifiedUser.sessionToken, walletAddress: address }),
    });

    const signedPayload = await provider.request({
      method: "personal_sign",
      params: [challenge.challenge, address],
    });

    const data = await apiRequest<{ user: SessionUser }>("/api/wallet/verify", {
      method: "POST",
      token: verifiedUser.sessionToken,
      body: JSON.stringify({
        sessionToken: verifiedUser.sessionToken,
        challengeId: challenge.challengeId,
        signature: String(signedPayload || ""),
      }),
    });

    setSessionUser(data.user);
    navigate(data.user.role === "admin" ? "/admin-dashboard" : "/user-dashboard");
  };

  const connectWallet = async (wallet: WalletOption) => {
    setBusy(true);
    setMessage("");

    try {
      const accounts = (await wallet.provider.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts[0];
      if (!address) {
        throw new Error("No wallet account selected.");
      }

      setWalletAddress(address);
      await verifyWallet(address, wallet.provider);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Wallet connection failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-primary bg-primary p-8 text-white shadow-lg shadow-primary/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,160,23,0.26),transparent_32%),linear-gradient(135deg,rgba(11,31,58,0.98),rgba(11,31,58,0.88))]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                <Shield size={12} />
                Bhutan NDI Access
              </div>
              <h1 className="mt-5 font-sans text-4xl font-bold uppercase leading-tight md:text-5xl">
                Verify identity, then <span className="text-gold-gradient">link your wallet</span>
              </h1>
              <p className="mt-4 max-w-lg text-white/80">
                The platform uses Bhutan NDI proof requests for identity and a wallet signature for marketplace actions. No personal identity data is stored on-chain.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  icon={ShoppingCart}
                  title="Buy property shares"
                  description="Browse full, partial, and secondary listings from the same marketplace account."
                />
                <InfoCard
                  icon={FileUp}
                  title="Sell property shares"
                  description="Submit property documents, list approved shares, and resell holdings from one dashboard."
                />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border border-t-4 border-t-gold bg-card/95 p-8 shadow-lg shadow-primary/10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gold/10 p-3 text-gold">
                {verifiedUser ? <Wallet size={22} /> : <QrCode size={22} />}
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold">{verifiedUser ? "Wallet linking" : "NDI proof request"}</h2>
                <p className="text-sm text-muted-foreground">
                  {verifiedUser ? "Sign the challenge from your verified session." : "Scan with Bhutan NDI Wallet and approve the proof request."}
                </p>
              </div>
            </div>

            {!proof && (
              <div className="mt-8 rounded-2xl border border-border/80 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Unified marketplace access</div>
                <div className="mt-2 font-serif text-3xl font-bold">Buyer and seller tools together</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  One verified user account can purchase shares, submit property documents, and resell owned shares.
                </p>
                <button
                  type="button"
                  onClick={() => void beginProof()}
                  disabled={busy}
                  className="mt-6 inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:bg-gold-light disabled:opacity-60"
                >
                  {busy ? "Creating..." : "Create NDI proof"}
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {proof && !verifiedUser && (
              <div className="mt-8 grid gap-6 md:grid-cols-[240px_1fr]">
                <div className="rounded-2xl border border-border bg-background p-4">
                  {qrImage ? (
                    <img src={qrImage} alt="NDI proof request QR code" className="mx-auto h-[220px] w-[220px] rounded-md bg-white p-2" />
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">Preparing QR...</div>
                  )}
                </div>
                <div className="rounded-2xl border border-border/80 bg-white p-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                    <Clock size={12} />
                    Waiting for wallet
                  </div>
                  <p className="mt-4 break-all text-sm text-muted-foreground">Thread ID: {proof.threadId}</p>
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

            {verifiedUser && (
              <div className="mt-8 space-y-5">
                <div className="rounded-2xl border border-border/80 bg-white p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">NDI verified</div>
                  <div className="mt-3 break-all text-sm text-muted-foreground">Holder DID: {verifiedUser.holderDid}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Display ID: {verifiedUser.idNumberDisplay}</div>
                </div>

                <div className="grid gap-3">
                  {walletOptions.length ? (
                    walletOptions.map((wallet) => (
                      <button
                        key={wallet.id}
                        type="button"
                        onClick={() => void connectWallet(wallet)}
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:bg-gold-light disabled:opacity-60"
                      >
                        {wallet.icon ? <img src={wallet.icon} alt="" className="h-5 w-5 rounded-full" /> : <Wallet size={16} />}
                        Connect {wallet.name}
                      </button>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
                      Install or unlock a browser wallet such as Rabby or MetaMask, then refresh this page.
                    </p>
                  )}
                </div>

                {walletAddress && <p className="text-sm text-muted-foreground">Selected wallet: {shortWallet(walletAddress)}</p>}
              </div>
            )}

            {message && <p className="mt-5 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">{message}</p>}
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
  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-left text-white">
    <Icon size={18} className="text-gold" />
    <div className="mt-3 font-semibold">{title}</div>
    <div className="mt-1 text-sm text-white/75">{description}</div>
  </div>
);
