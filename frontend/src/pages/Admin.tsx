import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Ban, Building2, ChevronLeft, ChevronRight, FileCheck, Layers3, LogOut, Shield, Sparkles, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { clearSessionUser, getSessionUser } from "@/lib/auth";
import { apiRequest, formatNu, getAuthToken, shortWallet, type AuditLogEntry, type LeaseRecord, type ListingRecord, type PropertyRecord } from "@/lib/api";
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";
import property4 from "@/assets/property4.jpg";
import property5 from "@/assets/property5.jpg";
import property6 from "@/assets/property6.jpg";

const propertyImages = [property1, property2, property3, property4, property5, property6];

const Admin = () => {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const token = getAuthToken(sessionUser);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [queue, setQueue] = useState<PropertyRecord[]>([]);
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [leases, setLeases] = useState<LeaseRecord[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState("");
  const [message, setMessage] = useState("");
  const [suspendWallet, setSuspendWallet] = useState("");
  const [queueIndex, setQueueIndex] = useState(0);

  const loadAdmin = async () => {
    try {
      const [propertyData, queueData, listingData, leaseData, auditData] = await Promise.all([
        apiRequest<{ properties: PropertyRecord[] }>("/api/properties"),
        apiRequest<{ queue: PropertyRecord[] }>("/api/admin/review-queue", { token }),
        apiRequest<{ listings: ListingRecord[] }>("/api/listings?status=ALL"),
        apiRequest<{ leases: LeaseRecord[] }>("/api/leases?status=ALL", { token }),
        apiRequest<{ auditLog: AuditLogEntry[] }>("/api/audit-log", { token }),
      ]);
      setProperties(propertyData.properties);
      setQueue(queueData.queue);
      setListings(listingData.listings);
      setLeases(leaseData.leases);
      setAuditLog(auditData.auditLog);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Backend unavailable. Start the backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdmin();
  }, []);

  useEffect(() => {
    setQueueIndex((current) => Math.min(current, Math.max(queue.length - 1, 0)));
  }, [queue.length]);

  const activeQueueItem = queue[queueIndex];
  const showPreviousQueueItem = () => setQueueIndex((current) => (queue.length ? (current - 1 + queue.length) % queue.length : 0));
  const showNextQueueItem = () => setQueueIndex((current) => (queue.length ? (current + 1) % queue.length : 0));

  const stats = useMemo(
    () => [
      { label: "Pending review", value: String(queue.length), icon: FileCheck },
      { label: "Tokenized", value: String(properties.filter((property) => property.tokenId).length), icon: BadgeCheck },
      { label: "Marketplace listings", value: String(listings.length), icon: Layers3 },
      { label: "On-chain leases", value: String(leases.filter((lease) => lease.status === "ACTIVE").length), icon: Wallet },
      { label: "Audit events", value: String(auditLog.length), icon: Shield },
    ],
    [auditLog.length, leases, listings.length, properties, queue.length],
  );

  const approveProperty = async (property: PropertyRecord) => {
    setSubmittingId(property._id);
    setMessage("");

    try {
      await apiRequest(`/api/admin/properties/${property._id}/approve`, {
        method: "POST",
        token,
        body: JSON.stringify({ sessionToken: token, notes: "Approved after admin document review" }),
      });
      setMessage(`${property.title} approved. Shares minted and listing created when requested.`);
      await loadAdmin();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Approval failed.");
    } finally {
      setSubmittingId("");
    }
  };

  const rejectProperty = async (property: PropertyRecord) => {
    setSubmittingId(property._id);
    setMessage("");

    try {
      await apiRequest(`/api/admin/properties/${property._id}/reject`, {
        method: "POST",
        token,
        body: JSON.stringify({ sessionToken: token, notes: "Document package requires correction" }),
      });
      setMessage(`${property.title} rejected with correction notes.`);
      await loadAdmin();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Rejection failed.");
    } finally {
      setSubmittingId("");
    }
  };

  const suspend = async () => {
    if (!suspendWallet.trim()) {
      return;
    }

    setMessage("");

    try {
      await apiRequest(`/api/admin/wallets/${suspendWallet.trim()}/suspend`, {
        method: "POST",
        token,
        body: JSON.stringify({ sessionToken: token, reason: "Manual admin risk flag" }),
      });
      setMessage(`Wallet ${shortWallet(suspendWallet)} suspended from new listings.`);
      setSuspendWallet("");
      await loadAdmin();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to suspend wallet.");
    }
  };

  const logout = () => {
    clearSessionUser();
    navigate("/login");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden border-b border-white/10 bg-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,160,23,0.24),transparent_34%),linear-gradient(135deg,rgba(11,31,58,0.98),rgba(11,31,58,0.90))]" />
        <div className="container mx-auto relative px-4 py-8 md:py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-gold">
                <Sparkles size={12} />
                Admin Console
              </div>
              <h1 className="mt-4 font-sans text-3xl font-bold uppercase leading-tight text-white md:text-5xl">
                Review, mint, and monitor <span className="text-gold-gradient">property shares</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 md:text-base">
                Approvals create ERC-6909 token IDs, mint 10,000 shares to the owner wallet, and write each action into the audit trail.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex w-fit items-center gap-2 rounded-sm border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-gold hover:text-gold"
              >
                Back to listings
              </Link>
              <button
                onClick={logout}
                className="inline-flex w-fit items-center gap-2 rounded-sm bg-gold px-4 py-2 text-sm font-semibold text-primary hover:bg-gold-light"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-lg border border-white/15 border-t-4 border-t-gold bg-white p-4 shadow-sm shadow-primary/10">
                  <div className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <span>{stat.label}</span>
                    <Icon size={16} className="text-gold" />
                  </div>
                  <div className="mt-2 font-serif text-2xl font-bold">{stat.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section className="container mx-auto px-4 py-10 md:py-12">
        {message && <div className="mb-6 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">{message}</div>}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-border border-t-4 border-t-gold bg-card p-5 shadow-sm shadow-primary/10 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold">Document review queue</h2>
                <p className="text-sm text-muted-foreground">Pending owner submissions awaiting approval or rejection.</p>
              </div>
              {loading && <span className="text-sm text-muted-foreground">Loading...</span>}
            </div>

            <div className="grid gap-4">
              {activeQueueItem ? (
                  <article key={activeQueueItem._id} className="rounded-lg border border-border/80 bg-secondary p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">{activeQueueItem.propertyType}</div>
                        <h3 className="mt-2 font-serif text-xl font-bold">{activeQueueItem.title}</h3>
                        <div className="mt-1 text-sm text-muted-foreground">{activeQueueItem.location}</div>
                        {activeQueueItem.threeWordLocation && <div className="mt-1 text-xs font-semibold text-gold">///{activeQueueItem.threeWordLocation}</div>}
                      </div>
                      <div className="rounded-sm border border-gold/30 bg-gold/10 px-3 py-1 text-sm font-semibold text-gold">
                        {activeQueueItem.requestedListingShares?.toLocaleString("en-IN") || "10,000"} shares requested
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {activeQueueItem.imageUrl && (
                        <div className="overflow-hidden rounded-lg border border-border/80 bg-white md:col-span-2">
                          <img src={activeQueueItem.imageUrl} alt={activeQueueItem.title} className="h-44 w-full object-cover" />
                        </div>
                      )}
                      <Detail label="Owner wallet" value={activeQueueItem.ownerWallet} />
                      {activeQueueItem.threeWordLocation && <Detail label="3-word location" value={`///${activeQueueItem.threeWordLocation}`} />}
                      <Detail label="Document hash" value={activeQueueItem.docHash} />
                      <Detail label="Encrypted storage" value={activeQueueItem.docStorageRef} />
                      {activeQueueItem.docGatewayUrl && <Detail label="Gateway URL" value={activeQueueItem.docGatewayUrl} />}
                      {activeQueueItem.imageStorageRef && <Detail label="Property photo" value={activeQueueItem.imageStorageRef} />}
                      <Detail label="Price per share" value={formatNu(Number(activeQueueItem.requestedPricePerShare || 0))} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void approveProperty(activeQueueItem)}
                        disabled={submittingId === activeQueueItem._id}
                        className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground hover:bg-gold-light disabled:opacity-60"
                      >
                        <BadgeCheck size={16} />
                        Approve and mint
                      </button>
                      <button
                        type="button"
                        onClick={() => void rejectProperty(activeQueueItem)}
                        disabled={submittingId === activeQueueItem._id}
                        className="inline-flex items-center gap-2 rounded-sm border border-border px-5 py-3 text-sm font-semibold uppercase tracking-widest hover:border-gold/40 hover:text-gold disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </article>
              ) : (
                <p className="rounded-lg border border-dashed border-primary/20 bg-secondary p-5 text-sm text-muted-foreground">
                  No pending submissions. Seller uploads from the user dashboard will appear here.
                </p>
              )}

              {queue.length > 1 && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-background px-3 py-2">
                  <button
                    type="button"
                    onClick={showPreviousQueueItem}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-secondary text-primary hover:border-gold hover:text-gold"
                    aria-label="Previous property submission"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="text-sm font-medium text-muted-foreground">
                    {queueIndex + 1} of {queue.length}
                  </div>
                  <button
                    type="button"
                    onClick={showNextQueueItem}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-secondary text-primary hover:border-gold hover:text-gold"
                    aria-label="Next property submission"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border border-t-4 border-t-gold bg-card p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-md bg-gold/10 p-3 text-gold">
                  <Ban size={22} />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold">Risk controls</h2>
                  <p className="text-sm text-muted-foreground">Suspend a wallet from creating new listings.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={suspendWallet}
                  onChange={(event) => setSuspendWallet(event.target.value)}
                  placeholder="0x..."
                  className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/60"
                />
                <button
                  type="button"
                  onClick={() => void suspend()}
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground hover:bg-gold-light"
                >
                  Suspend
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border border-t-4 border-t-gold bg-card p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-md bg-gold/10 p-3 text-gold">
                  <Layers3 size={22} />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold">Active records</h2>
                  <p className="text-sm text-muted-foreground">Tokenized properties and marketplace state.</p>
                </div>
              </div>
              <div className="space-y-4">
                {properties.slice(0, 5).map((property, index) => (
                  <div key={property._id} className="grid gap-4 rounded-lg border border-border/80 bg-secondary p-4 sm:grid-cols-[88px_1fr]">
                    <img
                      src={property.imageUrl || propertyImages[index % propertyImages.length]}
                      alt={property.title}
                      className="h-24 w-full rounded-md object-cover sm:h-20 sm:w-20"
                    />
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-serif text-lg font-semibold">{property.title}</h3>
                        <span className="rounded-sm border border-gold/30 bg-gold/10 px-2 py-1 text-xs font-semibold text-gold">{property.status}</span>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{property.location}</div>
                      {property.threeWordLocation && <div className="mt-1 text-xs font-semibold text-gold">///{property.threeWordLocation}</div>}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>Token {property.tokenId || "pending"}</span>
                        <span>{property.totalSupply?.toLocaleString("en-IN") || "10,000"} shares</span>
                        <span>{shortWallet(property.ownerWallet)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border border-border border-t-4 border-t-gold bg-card p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-md bg-gold/10 p-3 text-gold">
                <Building2 size={22} />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold">Marketplace listings</h2>
                <p className="text-sm text-muted-foreground">Full, partial, and secondary listings in one view.</p>
              </div>
            </div>
            <div className="grid gap-4">
              {listings.slice(0, 8).map((listing) => (
                <div key={listing.id} className="rounded-lg border border-border/80 bg-secondary p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-serif text-lg font-semibold">{listing.property?.title || listing.tokenId}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {listing.listingType} / {listing.status} / seller {shortWallet(listing.sellerWallet)}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {listing.sharesForSale.toLocaleString("en-IN")} shares at {formatNu(listing.pricePerShare)}
                    </div>
                  </div>
                </div>
              ))}
              {listings.length === 0 && <p className="rounded-lg border border-dashed border-primary/20 bg-secondary p-4 text-sm text-muted-foreground">No listings are active yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-border border-t-4 border-t-gold bg-card p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-md bg-gold/10 p-3 text-gold">
                <Wallet size={22} />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold">Lease agreements</h2>
                <p className="text-sm text-muted-foreground">On-chain lease records and locked share rights.</p>
              </div>
            </div>
            <div className="grid gap-4">
              {leases.slice(0, 8).map((lease) => (
                <div key={lease.id} className="rounded-lg border border-border/80 bg-secondary p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-serif text-lg font-semibold">{lease.property?.title || `Token ${lease.tokenId}`}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Lease #{lease.chainLeaseId} / {lease.status} / {lease.shareAmount.toLocaleString("en-IN")} shares
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{formatNu(lease.rentAmount)} rent</div>
                  </div>
                </div>
              ))}
              {leases.length === 0 && <p className="rounded-lg border border-dashed border-primary/20 bg-secondary p-4 text-sm text-muted-foreground">No lease agreements recorded yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-border border-t-4 border-t-gold bg-card p-5 shadow-sm md:p-6 xl:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-md bg-gold/10 p-3 text-gold">
                <Wallet size={22} />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold">Audit log</h2>
                <p className="text-sm text-muted-foreground">Every admin and transfer action is timestamped.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {auditLog.slice(0, 10).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border/80 bg-secondary p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{entry.action.replaceAll("_", " ")}</div>
                    <div className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="mt-2 break-all text-sm text-muted-foreground">
                    {entry.actor} -&gt; {entry.target}
                  </div>
                </div>
              ))}
              {auditLog.length === 0 && <p className="rounded-lg border border-dashed border-primary/20 bg-secondary p-4 text-sm text-muted-foreground">No audit events yet.</p>}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border border-border/80 bg-white p-3">
    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    <div className="mt-1 break-all text-sm font-semibold text-foreground">{value || "N/A"}</div>
  </div>
);

export default Admin;
