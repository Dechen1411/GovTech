import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Ban,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Home,
  Landmark,
  Layers3,
  LogOut,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { clearSessionUser, getSessionUser } from "@/lib/auth";
import { apiRequest, formatNu, getAuthToken, logoutSession, shortWallet, type AuditLogEntry, type LeaseRecord, type ListingRecord, type PropertyRecord } from "@/lib/api";
import { loadAdminDashboardData } from "@/lib/dataPreload";
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";
import property4 from "@/assets/property4.jpg";
import property5 from "@/assets/property5.jpg";
import property6 from "@/assets/property6.jpg";

const propertyImages = [property1, property2, property3, property4, property5, property6];

const serviceLinks = [
  { href: "#review", label: "Review desk", icon: FileCheck },
  { href: "#risk", label: "Risk controls", icon: Ban },
  { href: "#records", label: "Property records", icon: Building2 },
  { href: "#marketplace", label: "Marketplace", icon: Landmark },
  { href: "#leases", label: "Lease register", icon: CalendarDays },
  { href: "#audit", label: "Audit log", icon: ShieldCheck },
];

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

  const officerWallet = sessionUser?.adminWalletAddress || sessionUser?.walletAddress || sessionUser?.wallet || "";

  const loadAdmin = useCallback(async (preferPreload = true) => {
    try {
      const data = await loadAdminDashboardData(sessionUser, preferPreload);
      setProperties(data.properties);
      setQueue(data.queue);
      setListings(data.listings);
      setLeases(data.leases);
      setAuditLog(data.auditLog);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Backend unavailable. Start the backend server.");
    } finally {
      setLoading(false);
    }
  }, [sessionUser]);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  useEffect(() => {
    setQueueIndex((current) => Math.min(current, Math.max(queue.length - 1, 0)));
  }, [queue.length]);

  const activeQueueItem = queue[queueIndex];
  const showPreviousQueueItem = () => setQueueIndex((current) => (queue.length ? (current - 1 + queue.length) % queue.length : 0));
  const showNextQueueItem = () => setQueueIndex((current) => (queue.length ? (current + 1) % queue.length : 0));
  const tokenizedCount = properties.filter((property) => property.tokenId).length;
  const activeLeaseCount = leases.filter((lease) => lease.status === "ACTIVE").length;

  const stats = useMemo(
    () => [
      { title: "Pending review", value: String(queue.length), description: "Owner submissions awaiting decision", icon: FileCheck },
      { title: "Tokenized records", value: String(tokenizedCount), description: "Approved property share records", icon: BadgeCheck },
      { title: "Marketplace listings", value: String(listings.length), description: "Full, partial, and secondary offers", icon: Layers3 },
      { title: "Active leases", value: String(activeLeaseCount), description: "Lease records currently in force", icon: CalendarDays },
      { title: "Audit events", value: String(auditLog.length), description: "Administrative and transfer actions", icon: ShieldCheck },
    ],
    [activeLeaseCount, auditLog.length, listings.length, queue.length, tokenizedCount],
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
      await loadAdmin(false);
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
      await loadAdmin(false);
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
      await loadAdmin(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to suspend wallet.");
    }
  };

  const logout = () => {
    void logoutSession(token).catch(() => undefined);
    clearSessionUser();
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#eef2f5] text-foreground">
      <header className="border-b border-primary/20 bg-primary text-white shadow-sm">
        <div className="bg-[#7a1f2f]">
          <div className="container mx-auto flex min-h-9 flex-wrap items-center justify-between gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/90">
            <span className="inline-flex items-center gap-2">
              <Landmark size={14} />
              Royal Government Service Gateway
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={14} />
              Secure officer property session
            </span>
          </div>
        </div>

        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-gold text-primary">
              <Building2 size={22} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-bold md:text-lg">Digital Property Services Portal</span>
              <span className="block truncate text-xs font-medium text-white/70">Officer administration console</span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-sm border border-white/25 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:border-gold hover:text-gold"
            >
              <Home size={15} />
              Public portal
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-sm bg-gold px-4 py-2 text-xs font-bold uppercase tracking-wide text-primary hover:bg-gold-light"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="border-b border-border bg-white">
        <div className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-sm border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <ShieldCheck size={14} />
              NDI authorised officer access
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-primary md:text-4xl">Officer property service workspace</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
              Review submitted property records, approve tokenization, monitor marketplace activity, and manage platform risk controls from one official service area.
            </p>
          </div>

          <div className="border border-border bg-[#f8fafc] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Officer profile</div>
                <div className="mt-1 font-semibold text-primary">{sessionUser?.displayName || "Verified officer"}</div>
              </div>
              <span className="rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Active</span>
            </div>
            <div className="mt-3 grid gap-2 text-sm">
              <StatusLine icon={Wallet} label="Wallet" value={shortWallet(officerWallet) || "Not connected"} />
              <StatusLine icon={FileCheck} label="Officer ID" value={sessionUser?.idNumberDisplay || "NDI verified"} />
              <StatusLine icon={ShieldCheck} label="Access level" value="Document review and registry controls" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2 xl:grid-cols-5">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[#f8fafc]">
        <div className="container mx-auto flex flex-wrap gap-2 px-4 py-3">
          {serviceLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm hover:border-gold/60"
            >
              <link.icon size={14} className="text-gold" />
              {link.label}
            </a>
          ))}
        </div>
      </section>

      <section className="container mx-auto grid gap-6 px-4 py-8 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div className="border border-border bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service menu</div>
            <nav className="mt-3 grid gap-2">
              {serviceLinks.map((link) => (
                <a key={link.href} href={link.href} className="flex items-center gap-3 border border-border bg-[#f8fafc] px-3 py-3 text-sm font-semibold text-primary hover:border-gold/60">
                  <link.icon size={16} className="text-gold" />
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <section id="risk" className="border border-border bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#7a1f2f]/10 text-[#7a1f2f]">
                <Ban size={20} />
              </div>
              <div>
                <h2 className="font-bold text-primary">Risk controls</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Suspend a wallet from creating new listings.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <input
                value={suspendWallet}
                onChange={(event) => setSuspendWallet(event.target.value)}
                placeholder="0x..."
                className="min-w-0 rounded-sm border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-gold/60"
              />
              <button
                type="button"
                onClick={() => void suspend()}
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-gold-light"
              >
                <Ban size={16} />
                Suspend wallet
              </button>
            </div>
          </section>
        </aside>

        <div className="min-w-0 space-y-6">
          {message && <div className="border border-border bg-white px-4 py-3 text-sm text-muted-foreground shadow-sm">{message}</div>}

          <section id="review" className="border border-border bg-white shadow-sm">
            <SectionHeader
              icon={FileCheck}
              kicker="Officer review desk"
              title="Document review queue"
              description="Pending owner submissions awaiting verification, approval, or correction notes."
            >
              {queue.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={showPreviousQueueItem}
                    aria-label="Previous property submission"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-white text-primary hover:border-gold hover:text-gold"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="min-w-16 text-center text-sm font-semibold text-primary">
                    {queueIndex + 1} of {queue.length}
                  </span>
                  <button
                    type="button"
                    onClick={showNextQueueItem}
                    aria-label="Next property submission"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-white text-primary hover:border-gold hover:text-gold"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </SectionHeader>

            <div className="border-t border-border p-4 md:p-5">
              {loading && <p className="text-sm text-muted-foreground">Loading review queue...</p>}

              {!loading && !activeQueueItem ? (
                <EmptyState title="No pending submissions" description="Citizen property packages will appear here after upload from the citizen dashboard." />
              ) : activeQueueItem ? (
                <article className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="min-w-0">
                    <div className="border border-border bg-[#f8fafc] p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gold">{activeQueueItem.propertyType}</div>
                      <h3 className="mt-2 text-2xl font-bold text-primary">{activeQueueItem.title}</h3>
                      <div className="mt-2 text-sm text-muted-foreground">{activeQueueItem.location}</div>
                      {activeQueueItem.threeWordLocation && <div className="mt-1 text-xs font-semibold text-primary">///{activeQueueItem.threeWordLocation}</div>}
                      <div className="mt-4 inline-flex rounded-sm border border-gold/30 bg-gold/10 px-3 py-1 text-sm font-semibold text-primary">
                        {(activeQueueItem.requestedListingShares ?? activeQueueItem.totalSupply ?? 10000).toLocaleString("en-IN")} shares requested
                      </div>
                    </div>

                    {activeQueueItem.imageUrl && (
                      <div className="mt-4 overflow-hidden border border-border bg-[#eef2f5]">
                        <img src={activeQueueItem.imageUrl} alt={activeQueueItem.title} className="h-64 w-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Detail label="Owner wallet" value={activeQueueItem.ownerWallet} />
                      <Detail label="Price per share" value={formatNu(Number(activeQueueItem.requestedPricePerShare || 0))} />
                      <Detail label="Document hash" value={activeQueueItem.docHash} />
                      <Detail label="Encrypted storage" value={activeQueueItem.docStorageRef} />
                      {activeQueueItem.docGatewayUrl && <Detail label="Gateway URL" value={activeQueueItem.docGatewayUrl} />}
                      {activeQueueItem.imageStorageRef && <Detail label="Property photo" value={activeQueueItem.imageStorageRef} />}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
                      <button
                        type="button"
                        onClick={() => void approveProperty(activeQueueItem)}
                        disabled={submittingId === activeQueueItem._id}
                        className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-gold-light disabled:opacity-60"
                      >
                        <BadgeCheck size={16} />
                        Approve and mint
                      </button>
                      <button
                        type="button"
                        onClick={() => void rejectProperty(activeQueueItem)}
                        disabled={submittingId === activeQueueItem._id}
                        className="inline-flex items-center gap-2 rounded-sm border border-border px-5 py-3 text-sm font-semibold uppercase tracking-wide text-primary hover:border-[#7a1f2f] hover:text-[#7a1f2f] disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              ) : null}
            </div>
          </section>

          <section id="records" className="border border-border bg-white shadow-sm">
            <SectionHeader icon={Building2} kicker="Property registry" title="Active property records" description="Approved records, pending submissions, and owner references currently stored by the platform." />
            <div className="border-t border-border p-4 md:p-5">
              {properties.length > 0 ? (
                <div className="grid gap-3">
                  {properties.slice(0, 8).map((property, index) => (
                    <article key={property._id} className="grid gap-4 border border-border bg-[#f8fafc] p-4 md:grid-cols-[112px_minmax(0,1fr)_auto] md:items-center">
                      <img
                        src={property.imageUrl || propertyImages[index % propertyImages.length]}
                        alt={property.title}
                        className="h-28 w-full bg-[#eef2f5] object-cover md:h-20 md:w-28"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-primary">{property.title}</h3>
                          <StatusBadge value={property.status} />
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">{property.location}</div>
                        {property.threeWordLocation && <div className="mt-1 text-xs font-semibold text-primary">///{property.threeWordLocation}</div>}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Token {property.tokenId || "pending"}</span>
                          <span>{property.totalSupply?.toLocaleString("en-IN") || "10,000"} shares</span>
                          <span>Owner {shortWallet(property.ownerWallet)}</span>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-primary">{formatNu(Number(property.requestedPricePerShare || 0))}</div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No property records" description="Approved and submitted records will appear here after citizen uploads begin." />
              )}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section id="marketplace" className="border border-border bg-white shadow-sm">
              <SectionHeader icon={Landmark} kicker="Marketplace supervision" title="Listings" description="Full, partial, and secondary listings visible to citizens." />
              <div className="overflow-x-auto border-t border-border">
                <table className="min-w-[680px] w-full text-left text-sm">
                  <thead className="bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Property</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Shares</th>
                      <th className="px-4 py-3">Ask</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {listings.slice(0, 8).map((listing) => (
                      <tr key={listing.id}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-primary">{listing.property?.title || `Token ${listing.tokenId}`}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{listing.listingType} / seller {shortWallet(listing.sellerWallet)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge value={listing.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{listing.sharesForSale.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 font-semibold text-primary">{formatNu(listing.pricePerShare)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {listings.length === 0 && <div className="p-4"><EmptyState title="No listings" description="Approved share offers will appear after officer approval." /></div>}
              </div>
            </section>

            <section id="leases" className="border border-border bg-white shadow-sm">
              <SectionHeader icon={CalendarDays} kicker="Lease register" title="Lease agreements" description="On-chain lease records and locked share rights." />
              <div className="overflow-x-auto border-t border-border">
                <table className="min-w-[680px] w-full text-left text-sm">
                  <thead className="bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Record</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Shares</th>
                      <th className="px-4 py-3">Rent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leases.slice(0, 8).map((lease) => (
                      <tr key={lease.id}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-primary">{lease.property?.title || `Token ${lease.tokenId}`}</div>
                          <div className="mt-1 text-xs text-muted-foreground">Lease #{lease.chainLeaseId || "pending"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge value={lease.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{lease.shareAmount.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 font-semibold text-primary">{formatNu(lease.rentAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {leases.length === 0 && <div className="p-4"><EmptyState title="No leases" description="Lease agreements will appear after citizens record them." /></div>}
              </div>
            </section>
          </div>

          <section id="audit" className="border border-border bg-white shadow-sm">
            <SectionHeader icon={ShieldCheck} kicker="Platform accountability" title="Audit log" description="Administrative decisions, transfers, and session events are timestamped for review." />
            <div className="overflow-x-auto border-t border-border">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLog.slice(0, 12).map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 font-semibold text-primary">{entry.action.replaceAll("_", " ")}</td>
                      <td className="max-w-60 break-all px-4 py-3 text-xs text-muted-foreground">{entry.actor}</td>
                      <td className="max-w-60 break-all px-4 py-3 text-xs text-muted-foreground">{entry.target}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditLog.length === 0 && <div className="p-4"><EmptyState title="No audit events" description="Officer actions and transfer events will appear here." /></div>}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

const SectionHeader = ({
  icon: Icon,
  kicker,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  kicker: string;
  title: string;
  description: string;
  children?: ReactNode;
}) => (
  <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between md:p-5">
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
        <Icon size={20} />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-gold">{kicker}</div>
        <h2 className="mt-1 text-xl font-bold text-primary md:text-2xl">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

const StatusLine = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <Icon size={15} className="mt-0.5 shrink-0 text-gold" />
    <div className="min-w-0">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-medium text-primary">{value}</div>
    </div>
  </div>
);

const StatCard = ({ title, value, description, icon: Icon }: { title: string; value: string; description: string; icon: LucideIcon }) => (
  <div className="border border-border bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <Icon size={17} className="text-gold" />
    </div>
    <div className="mt-3 text-2xl font-bold text-primary">{value}</div>
    <div className="mt-1 text-sm text-muted-foreground">{description}</div>
  </div>
);

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="border border-border/80 bg-white p-3">
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-1 break-all text-sm font-semibold text-foreground">{value || "N/A"}</div>
  </div>
);

const StatusBadge = ({ value }: { value: string }) => {
  const isAttention = ["PENDING", "REJECTED", "CANCELLED"].includes(value);
  return (
    <span className={`inline-flex rounded-sm border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${isAttention ? "border-[#7a1f2f]/20 bg-[#fff7f8] text-[#7a1f2f]" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
      {value}
    </span>
  );
};

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="border border-dashed border-primary/25 bg-[#f8fafc] p-5">
    <h3 className="text-lg font-bold text-primary">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
  </div>
);

export default Admin;
