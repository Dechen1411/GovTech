import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { BadgeCheck, CalendarDays, FileUp, ImageIcon, Layers3, LogOut, MapPin, RotateCcw, ShoppingCart, SlidersHorizontal, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { clearSessionUser, getSessionUser } from "@/lib/auth";
import {
  apiRequest,
  formatNu,
  getAuthToken,
  readFileAsDataUrl,
  shortWallet,
  type LeaseRecord,
  type ListingRecord,
  type PortfolioHolding,
} from "@/lib/api";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import heroBg from "@/assets/hero-bg.jpg";
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";
import property4 from "@/assets/property4.jpg";
import property5 from "@/assets/property5.jpg";
import property6 from "@/assets/property6.jpg";

const propertyImages = [property1, property2, property3, property4, property5, property6];

const emptyDocumentForm = {
  title: "",
  location: "",
  propertyType: "Residential",
  pricePerShare: "500",
  requestedListingShares: "2500",
  description: "",
};

const emptyResaleForm = {
  tokenId: "",
  sharesForSale: "100",
  pricePerShare: "500",
};

const emptyLeaseForm = {
  tokenId: "",
  lesseeWallet: "",
  shareAmount: "1000",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  rentAmount: "10000",
  depositAmount: "10000",
  notes: "",
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [leases, setLeases] = useState<LeaseRecord[]>([]);
  const [selectedListingId, setSelectedListingId] = useState("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [documentForm, setDocumentForm] = useState(emptyDocumentForm);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [resaleForm, setResaleForm] = useState(emptyResaleForm);
  const [leaseForm, setLeaseForm] = useState(emptyLeaseForm);

  const wallet = sessionUser?.walletAddress || sessionUser?.wallet || "";
  const token = getAuthToken(sessionUser);

  useEffect(() => {
    if (!sessionUser || sessionUser.role === "admin") {
      navigate("/login");
    }
  }, [navigate, sessionUser]);

  const loadDashboard = async () => {
    if (!wallet) {
      setLoading(false);
      return;
    }

    try {
      const [listingData, portfolioData] = await Promise.all([
        apiRequest<{ listings: ListingRecord[] }>("/api/listings"),
        apiRequest<{ holdings: PortfolioHolding[]; leases: LeaseRecord[] }>(`/api/portfolio/${wallet}`),
      ]);
      setListings(listingData.listings);
      setHoldings(portfolioData.holdings);
      setLeases(portfolioData.leases);
      setSelectedListingId((current) => current || listingData.listings[0]?.id || "");
      setResaleForm((current) => ({ ...current, tokenId: current.tokenId || portfolioData.holdings[0]?.tokenId || "" }));
      setLeaseForm((current) => ({ ...current, tokenId: current.tokenId || portfolioData.holdings[0]?.tokenId || "" }));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Backend unavailable. Start the backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [wallet]);

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedListingId) || listings[0],
    [listings, selectedListingId],
  );
  const photoPreviewUrl = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : ""), [photoFile]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  useEffect(() => {
    setQty((current) => Math.min(Math.max(current, 1), selectedListing?.sharesForSale || 1));
  }, [selectedListing?.id, selectedListing?.sharesForSale]);

  const stats = useMemo(
    () => [
      { title: "Active listings", value: String(listings.length), description: "Full, partial, and secondary" },
      { title: "Wallet", value: wallet ? "Linked" : "Missing", description: wallet ? shortWallet(wallet) : "Connect again from login" },
      { title: "Portfolio", value: String(holdings.length), description: "Token IDs held by this wallet" },
      { title: "Active leases", value: String(leases.filter((lease) => lease.status === "ACTIVE").length), description: "On-chain lease agreements" },
    ],
    [holdings.length, leases, listings.length, wallet],
  );

  const buyShares = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedListing) {
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      await apiRequest("/api/orders", {
        method: "POST",
        token,
        body: JSON.stringify({ sessionToken: token, listingId: selectedListing.id, qty }),
      });
      setMessage(`Purchase complete: ${qty.toLocaleString("en-IN")} shares transferred to your wallet.`);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Purchase failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!documentFile) {
      setMessage("Upload the legal document bundle before submitting.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const documentData = await readFileAsDataUrl(documentFile);
      const photoData = photoFile ? await readFileAsDataUrl(photoFile) : undefined;
      await apiRequest("/api/documents/submit", {
        method: "POST",
        token,
        body: JSON.stringify({
          sessionToken: token,
          ...documentForm,
          pricePerShare: Number(documentForm.pricePerShare),
          requestedListingShares: Number(documentForm.requestedListingShares),
          documentName: documentFile.name,
          documentData,
          photoName: photoFile?.name,
          photoData,
        }),
      });
      setDocumentForm(emptyDocumentForm);
      setDocumentFile(null);
      setPhotoFile(null);
      setMessage("Document submitted. Admin approval will mint ERC-6909 shares and open the requested listing.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Document submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const createResaleListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await apiRequest("/api/listings", {
        method: "POST",
        token,
        body: JSON.stringify({
          sessionToken: token,
          tokenId: resaleForm.tokenId,
          sharesForSale: Number(resaleForm.sharesForSale),
          pricePerShare: Number(resaleForm.pricePerShare),
          listingType: "SECONDARY",
        }),
      });
      setResaleForm((current) => ({ ...current, sharesForSale: "100" }));
      setMessage("Secondary listing created and approved for marketplace transfer.");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create resale listing.");
    } finally {
      setSubmitting(false);
    }
  };

  const createLeaseAgreement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await apiRequest("/api/leases", {
        method: "POST",
        token,
        body: JSON.stringify({
          sessionToken: token,
          tokenId: leaseForm.tokenId,
          lesseeWallet: leaseForm.lesseeWallet,
          shareAmount: Number(leaseForm.shareAmount),
          startDate: leaseForm.startDate,
          endDate: leaseForm.endDate,
          rentAmount: Number(leaseForm.rentAmount),
          depositAmount: Number(leaseForm.depositAmount),
          notes: leaseForm.notes,
        }),
      });
      setLeaseForm((current) => ({ ...emptyLeaseForm, tokenId: current.tokenId }));
      setMessage("Lease agreement recorded on-chain and active shares locked.");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create lease agreement.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDocumentFile = (event: ChangeEvent<HTMLInputElement>) => {
    setDocumentFile(event.target.files?.[0] ?? null);
  };

  const onPhotoFile = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotoFile(event.target.files?.[0] ?? null);
  };

  const logout = () => {
    clearSessionUser();
    navigate("/login");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Luxury property in Thimphu" width={1920} height={1080} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,31,58,0.96)_0%,rgba(11,31,58,0.84)_45%,rgba(11,31,58,0.45)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-primary to-transparent" />
        </div>

        <div className="relative z-10 border-b border-white/10 bg-primary/95 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-5">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold"
            >
              <ShoppingCart size={12} />
              Smart Property Platform
            </Link>
            <div className="flex gap-3">
              <Link to="/" className="rounded-sm border border-white/30 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-white hover:border-gold hover:text-gold">
                Home
              </Link>
              <button onClick={logout} className="rounded-sm bg-gold px-4 py-2 text-sm font-semibold uppercase tracking-widest text-primary hover:bg-gold-light">
                <LogOut size={16} className="mr-2 inline" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-10 md:py-14">
          <div className="mx-auto max-w-6xl opacity-0 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold">
              <BadgeCheck size={12} />
              NDI Verified Marketplace
            </div>
            <h1 className="mt-4 max-w-4xl font-sans text-3xl font-bold uppercase leading-tight text-white md:text-5xl">
              Buy, list, and resell <span className="text-gold-gradient">property shares</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/82 md:text-lg">
              Each approved property is represented as 10,000 ERC-6909 shares. Purchase a full property or choose the exact fraction you want.
            </p>

            <div className="mt-8 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="marketplace" className="border-y border-border/80 bg-secondary py-10 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest text-gold">Marketplace</span>
              <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">
                Verified <span className="text-gold-gradient">Share Listings</span>
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Browse approved full, partial, and secondary resale listings. Every purchase settles through the same verified share-transfer flow.
              </p>
            </div>
            {loading && <span className="text-sm text-muted-foreground">Loading live listings...</span>}
          </div>

          {listings.length === 0 ? (
            <div className="grid gap-5 rounded-xl border border-dashed border-primary/20 bg-background p-6 md:grid-cols-[1fr_280px] md:items-center">
              <div>
                <h3 className="font-serif text-2xl font-bold">No active listings yet</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Approved properties will appear here after admin review and minting. You can still submit a property package below.
                </p>
              </div>
              <a
                href="#submit-property"
                className="inline-flex items-center justify-center rounded-sm bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground hover:bg-gold-light"
              >
                Submit property
              </a>
            </div>
          ) : (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-8 md:grid-cols-2">
              {listings.map((listing, index) => {
                const property = listing.property;
                return (
                  <button
                    key={listing.id}
                    type="button"
                    onClick={() => setSelectedListingId(listing.id)}
                    className={`group overflow-hidden rounded-lg border text-left transition-all duration-300 ${
                      selectedListing?.id === listing.id ? "border-gold bg-gold/10" : "border-border bg-card hover:border-gold/35 hover:shadow-lg hover:shadow-gold/10"
                    }`}
                  >
                    <div className="relative h-56 overflow-hidden bg-background">
                      <img
                        src={property?.imageUrl || propertyImages[index % propertyImages.length]}
                        alt={property?.title || listing.tokenId}
                        loading="lazy"
                        width={800}
                        height={600}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_35%),linear-gradient(to_bottom,rgba(15,23,42,0.08),rgba(15,23,42,0.55))]" />
                      <div className="absolute left-4 top-4 rounded-sm border border-gold/30 bg-background/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-gold">
                        {listing.listingType}
                      </div>
                      <div className="absolute right-4 top-4 rounded-sm bg-primary px-3 py-1 text-xs font-bold tracking-wider text-primary-foreground">
                        {formatNu(listing.pricePerShare)} / share
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="font-serif text-2xl font-bold text-white drop-shadow">{property?.title || `Token ${listing.tokenId}`}</div>
                        <div className="mt-1 flex items-center gap-1 text-sm text-white/85">
                          <MapPin size={14} className="text-gold" />
                          {property?.location || "Verified property"}
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Metric label="Shares" value={listing.sharesForSale.toLocaleString("en-IN")} />
                        <Metric label="Ownership" value={`${listing.ownershipPercentForSale}%`} />
                        <Metric label="Holders" value={String(listing.holderCount)} />
                        <Metric label="Total ask" value={formatNu(listing.totalAsk)} />
                      </div>
                      <div className="mt-4 flex items-center gap-2 break-all text-xs text-muted-foreground">
                        <Wallet size={13} className="text-gold" />
                        Seller {shortWallet(listing.sellerWallet)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-border border-t-4 border-t-gold bg-card p-5 shadow-sm shadow-primary/10 md:p-6 lg:sticky lg:top-8 lg:self-start">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-gold/10 p-3 text-gold">
                  <SlidersHorizontal size={22} />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold">Fractional purchase</h2>
                  <p className="text-sm text-muted-foreground">Choose an exact quantity and submit a wallet-backed transfer.</p>
                </div>
              </div>

              {selectedListing ? (
                <>
                  <div className="rounded-lg border border-border/80 bg-secondary p-4">
                    <div className="text-sm text-muted-foreground">Selected listing</div>
                    <div className="mt-1 font-serif text-xl font-semibold">{selectedListing.property?.title || selectedListing.tokenId}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {selectedListing.sharesForSale.toLocaleString("en-IN")} shares available at {formatNu(selectedListing.pricePerShare)} each
                    </div>
                  </div>

                  <form onSubmit={buyShares} className="mt-6 space-y-5">
                    <div>
                      <div className="mb-3 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Quantity</span>
                        <span className="font-semibold text-gold">{qty.toLocaleString("en-IN")} shares</span>
                      </div>
                      <Slider value={[qty]} min={1} max={Math.max(selectedListing.sharesForSale, 1)} step={1} onValueChange={(value) => setQty(value[0] || 1)} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Metric label="Ownership" value={`${((qty / (selectedListing.property?.totalSupply || 10000)) * 100).toFixed(2)}%`} />
                      <Metric label="Total" value={formatNu(qty * selectedListing.pricePerShare)} />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-all hover:bg-gold-light disabled:opacity-60"
                    >
                      <ShoppingCart size={16} />
                      {submitting ? "Processing..." : "Buy shares"}
                    </button>
                  </form>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No active listings available.</p>
              )}
            </div>
          </div>
          )}
        </div>
      </section>

      <section className="bg-background py-10 md:py-12">
        <div className="container mx-auto grid gap-6 px-4 xl:grid-cols-[0.86fr_1.14fr]">
          <div className="rounded-xl border border-border border-t-4 border-t-gold bg-card p-5 shadow-sm md:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-md bg-gold/10 p-3 text-gold">
                <Layers3 size={22} />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold">Share portfolio</h2>
                <p className="text-sm text-muted-foreground">Balances are derived from the ERC-6909 service state.</p>
              </div>
            </div>

            <div className="grid gap-4">
              {holdings.length > 0 ? (
                holdings.map((holding) => (
                  <div key={holding.tokenId} className="rounded-lg border border-border/80 bg-secondary p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-serif text-xl font-semibold">{holding.property?.title || `Token ${holding.tokenId}`}</div>
                        <div className="mt-1 text-sm text-muted-foreground">Token ID {holding.tokenId}</div>
                      </div>
                      <div className="rounded-sm border border-gold/30 bg-gold/10 px-3 py-1 text-sm font-semibold text-gold">
                        {holding.percentage}% ownership
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <Metric label="Shares held" value={holding.balance.toLocaleString("en-IN")} />
                      <Metric label="Est. value" value={formatNu(holding.estimatedValue)} />
                      <Metric label="Status" value={holding.property?.status || "ACTIVE"} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-border/80 bg-secondary p-4 text-sm text-muted-foreground">
                  No shares yet. Purchase from the marketplace to populate your portfolio.
                </p>
              )}
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <h3 className="font-serif text-xl font-semibold">Lease agreements</h3>
              <div className="mt-4 grid gap-4">
                {leases.length > 0 ? (
                  leases.map((lease) => (
                    <div key={lease.id} className="rounded-lg border border-border/80 bg-secondary p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-serif text-lg font-semibold">{lease.property?.title || `Token ${lease.tokenId}`}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {new Date(lease.startDateIso).toLocaleDateString()} - {new Date(lease.endDateIso).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="rounded-sm border border-gold/30 bg-gold/10 px-3 py-1 text-sm font-semibold text-gold">{lease.status}</div>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <Metric label="Shares leased" value={lease.shareAmount.toLocaleString("en-IN")} />
                        <Metric label="Rent" value={formatNu(lease.rentAmount)} />
                        <Metric label="Chain lease" value={lease.chainLeaseId || "pending"} />
                      </div>
                      <div className="mt-3 break-all text-xs text-muted-foreground">
                        {shortWallet(lease.lessorWallet)} to {shortWallet(lease.lesseeWallet)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-border/80 bg-secondary p-4 text-sm text-muted-foreground">No lease agreements for this wallet yet.</p>
                )}
              </div>
            </div>
          </div>

          <div id="submit-property" className="rounded-xl border border-border border-t-4 border-t-gold bg-card p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Actions</span>
                <h2 className="mt-1 font-serif text-2xl font-bold">Property service panel</h2>
                <p className="mt-1 text-sm text-muted-foreground">Submit documents, relist owned shares, or record an on-chain lease from one workspace.</p>
              </div>
              <div className="rounded-sm border border-primary/10 bg-background px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {shortWallet(wallet)}
              </div>
            </div>

            <Tabs defaultValue="submit" className="mt-5">
              <TabsList className="grid h-auto w-full grid-cols-3 rounded-md bg-background p-1">
                <TabsTrigger value="submit" className="rounded-sm text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Submit
                </TabsTrigger>
                <TabsTrigger value="resale" className="rounded-sm text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Resale
                </TabsTrigger>
                <TabsTrigger value="lease" className="rounded-sm text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Lease
                </TabsTrigger>
              </TabsList>

              <TabsContent value="submit" className="mt-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-md bg-gold/10 p-3 text-gold">
                    <FileUp size={22} />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold">Submit property documents</h3>
                    <p className="text-sm text-muted-foreground">Legal files are encrypted; photos are pinned publicly for listing cards.</p>
                  </div>
                </div>

                <form onSubmit={submitDocument} className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Title" value={documentForm.title} onChange={(value) => setDocumentForm((current) => ({ ...current, title: value }))} />
                    <Field label="Location" value={documentForm.location} onChange={(value) => setDocumentForm((current) => ({ ...current, location: value }))} />
                    <Field label="Property type" value={documentForm.propertyType} onChange={(value) => setDocumentForm((current) => ({ ...current, propertyType: value }))} />
                    <Field label="Price per share" value={documentForm.pricePerShare} onChange={(value) => setDocumentForm((current) => ({ ...current, pricePerShare: value }))} />
                    <Field label="Initial shares to list" value={documentForm.requestedListingShares} onChange={(value) => setDocumentForm((current) => ({ ...current, requestedListingShares: value }))} />
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-muted-foreground">Legal document bundle</span>
                      <input
                        type="file"
                        onChange={onDocumentFile}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none file:mr-3 file:rounded-sm file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-widest file:text-primary-foreground"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-muted-foreground">Property photo</span>
                      <div className="grid gap-4 rounded-md border border-border bg-background p-3 sm:grid-cols-[160px_1fr]">
                        <div className="flex h-28 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary">
                          {photoPreviewUrl ? (
                            <img src={photoPreviewUrl} alt="Selected property" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon size={28} className="text-gold" />
                          )}
                        </div>
                        <div className="flex flex-col justify-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={onPhotoFile}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none file:mr-3 file:rounded-sm file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-widest file:text-primary-foreground"
                          />
                          <p className="text-sm text-muted-foreground">
                            {photoFile ? photoFile.name : "This image appears on marketplace and admin cards after submission."}
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-muted-foreground">Description</span>
                    <textarea
                      value={documentForm.description}
                      onChange={(event) => setDocumentForm((current) => ({ ...current, description: event.target.value }))}
                      className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/60"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-fit items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground hover:bg-gold-light disabled:opacity-60"
                  >
                    Submit for review
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="resale" className="mt-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-md bg-gold/10 p-3 text-gold">
                    <RotateCcw size={22} />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold">Create resale listing</h3>
                    <p className="text-sm text-muted-foreground">Any shareholder can relist all or part of their balance.</p>
                  </div>
                </div>

                <form onSubmit={createResaleListing} className="grid gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-muted-foreground">Token ID</span>
                    <select
                      value={resaleForm.tokenId}
                      onChange={(event) => setResaleForm((current) => ({ ...current, tokenId: event.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/60"
                    >
                      {holdings.map((holding) => (
                        <option key={holding.tokenId} value={holding.tokenId}>
                          {holding.tokenId} - {holding.property?.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Shares for sale" value={resaleForm.sharesForSale} onChange={(value) => setResaleForm((current) => ({ ...current, sharesForSale: value }))} />
                    <Field label="Price per share" value={resaleForm.pricePerShare} onChange={(value) => setResaleForm((current) => ({ ...current, pricePerShare: value }))} />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || holdings.length === 0}
                    className="inline-flex w-fit items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground hover:bg-gold-light disabled:opacity-60"
                  >
                    Create listing
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="lease" className="mt-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-md bg-gold/10 p-3 text-gold">
                    <CalendarDays size={22} />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold">Create lease agreement</h3>
                    <p className="text-sm text-muted-foreground">Lease usage rights without transferring property share ownership.</p>
                  </div>
                </div>

                <form onSubmit={createLeaseAgreement} className="grid gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-muted-foreground">Token ID</span>
                    <select
                      value={leaseForm.tokenId}
                      onChange={(event) => setLeaseForm((current) => ({ ...current, tokenId: event.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/60"
                    >
                      {holdings.map((holding) => (
                        <option key={holding.tokenId} value={holding.tokenId}>
                          {holding.tokenId} - {holding.property?.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field label="Lessee wallet" value={leaseForm.lesseeWallet} onChange={(value) => setLeaseForm((current) => ({ ...current, lesseeWallet: value }))} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Shares leased" value={leaseForm.shareAmount} onChange={(value) => setLeaseForm((current) => ({ ...current, shareAmount: value }))} />
                    <Field label="Monthly rent" value={leaseForm.rentAmount} onChange={(value) => setLeaseForm((current) => ({ ...current, rentAmount: value }))} />
                    <Field label="Deposit" value={leaseForm.depositAmount} onChange={(value) => setLeaseForm((current) => ({ ...current, depositAmount: value }))} />
                    <Field label="Start date" type="date" value={leaseForm.startDate} onChange={(value) => setLeaseForm((current) => ({ ...current, startDate: value }))} />
                    <Field label="End date" type="date" value={leaseForm.endDate} onChange={(value) => setLeaseForm((current) => ({ ...current, endDate: value }))} />
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-muted-foreground">Lease notes</span>
                    <textarea
                      value={leaseForm.notes}
                      onChange={(event) => setLeaseForm((current) => ({ ...current, notes: event.target.value }))}
                      className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/60"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={submitting || holdings.length === 0}
                    className="inline-flex w-fit items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground hover:bg-gold-light disabled:opacity-60"
                  >
                    Record lease on-chain
                  </button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {message && (
          <div className="container mx-auto mt-8 px-4">
            <div className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">{message}</div>
          </div>
        )}
      </section>
    </main>
  );
};

const StatCard = ({ title, value, description }: { title: string; value: string; description: string }) => (
  <div className="rounded-lg border border-white/15 border-t-4 border-t-gold bg-white p-4 text-left text-foreground shadow-sm shadow-primary/10">
    <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{title}</div>
    <div className="mt-2 font-serif text-2xl font-bold text-gold">{value}</div>
    <div className="mt-1 text-sm text-muted-foreground">{description}</div>
  </div>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border border-border/80 bg-secondary p-3">
    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
  </div>
);

const Field = ({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (value: string) => void }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-muted-foreground">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
    />
  </label>
);

export default UserDashboard;
