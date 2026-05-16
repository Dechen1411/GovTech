import { useEffect, useMemo, useState } from "react";
import { FileCheck, History, Layers3, MapPin, ShieldCheck, Wallet } from "lucide-react";
import { apiRequest, formatNu, shortWallet, type ListingRecord } from "@/lib/api";
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";
import property4 from "@/assets/property4.jpg";
import property5 from "@/assets/property5.jpg";
import property6 from "@/assets/property6.jpg";

const fallbackProperties = [
  { image: property1, title: "Luxury Apartment Complex", price: "Nu. 45,00,000", location: "Motithang, Thimphu", verification: "Blockchain Ownership Verified", documents: "12 Documents Hash-Verified", shares: "2,500 shares available", history: "4 On-Chain Ownership Events", wallet: "0x8F2A1d3B4c5E6F7890123456789aBcDeF0123456", searchText: "luxury apartment complex motithang thimphu verified listing" },
  { image: property2, title: "Mountain View Villa", price: "Nu. 850 / share", location: "Babesa, Thimphu", verification: "Blockchain Ownership Verified", documents: "Document hash anchored", shares: "2,500 shares available", history: "3 Holder Events", wallet: "0xa110000000000000000000000000000000000001", searchText: "mountain view villa babesa thimphu property shares partial listing" },
  { image: property3, title: "Premium Penthouse", price: "Nu. 1,20,00,000", location: "Changlimithang, Thimphu", verification: "Blockchain Ownership Verified", documents: "11 Documents Hash-Verified", shares: "10,000 full-property shares", history: "5 On-Chain Ownership Events", wallet: "0x8F2A1d3B4c5E6F7890123456789aBcDeF0123456", searchText: "premium penthouse changlimithang thimphu full property listing" },
];

const propertyImages = [property1, property2, property3, property4, property5, property6];

type CardProperty = {
  image: string;
  title: string;
  price: string;
  location: string;
  threeWordLocation?: string;
  verification: string;
  documents: string;
  shares: string;
  history: string;
  wallet: string;
  searchText: string;
};

const mapListing = (listing: ListingRecord, index: number): CardProperty => ({
  image: listing.property?.imageUrl || propertyImages[index % propertyImages.length],
  title: listing.property?.title || `Property token ${listing.tokenId}`,
  price: `${formatNu(listing.pricePerShare)} / share`,
  location: listing.property?.location || "Thimphu, Bhutan",
  threeWordLocation: listing.property?.threeWordLocation,
  verification: `${listing.listingType} listing`,
  documents: `Document hash ${listing.property?.docHash?.slice(0, 18) || "0x"}...`,
  shares: `${listing.sharesForSale.toLocaleString("en-IN")} shares available (${listing.ownershipPercentForSale}%)`,
  history: `${listing.holderCount} current holder${listing.holderCount === 1 ? "" : "s"}`,
  wallet: listing.sellerWallet,
  searchText: [
    listing.id,
    listing.tokenId,
    listing.listingType,
    listing.status,
    listing.sellerWallet,
    listing.property?.title,
    listing.property?.location,
    listing.property?.threeWordLocation,
    listing.property?.propertyType,
    listing.property?.docHash,
    listing.property?.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase(),
});

const PropertiesSection = () => {
  const [properties, setProperties] = useState<CardProperty[]>(fallbackProperties);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadProperties = async () => {
    try {
      const data = await apiRequest<{ listings?: ListingRecord[] }>("/api/listings");

      if (!data.listings?.length) {
        setProperties(fallbackProperties);
        return;
      }

      setProperties(data.listings.slice(0, 6).map(mapListing));
    } catch {
      setProperties(fallbackProperties);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProperties();
  }, []);

  useEffect(() => {
    const onSearch = (event: Event) => {
      const query = (event as CustomEvent<{ query?: string }>).detail?.query ?? "";
      setSearchQuery(query);
    };

    window.addEventListener("property-search", onSearch);
    return () => window.removeEventListener("property-search", onSearch);
  }, []);

  const filteredProperties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return properties;
    }

    return properties.filter((property) => property.searchText.includes(query));
  }, [properties, searchQuery]);

  return (
    <section id="properties" className="section-padding bg-card/50">
      <div className="container mx-auto">
        <div className="mb-16 text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-gold">Our Portfolio</span>
          <h2 className="mt-3 font-serif text-3xl font-bold md:text-5xl">
            Verified <span className="text-gold-gradient">Property Shares</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Each listing includes ERC-6909 share availability, document hash validation, and wallet-based ownership history.
          </p>
        </div>

        {isLoading && (
          <div className="mb-8 rounded-lg border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">
            Loading verified property share records from the backend...
          </div>
        )}

        {searchQuery && !isLoading && (
          <div className="mb-8 flex flex-col gap-3 rounded-lg border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {filteredProperties.length} listing{filteredProperties.length === 1 ? "" : "s"} for "{searchQuery}".
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="w-fit text-xs font-semibold uppercase tracking-widest text-gold hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((p, i) => (
            <div
              key={`${p.title}-${i}`}
              className="group overflow-hidden rounded-lg border border-border bg-card transition-all duration-500 hover:gold-border hover:gold-glow"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute right-4 top-4 rounded-sm bg-primary px-3 py-1 text-xs font-bold tracking-wider text-primary-foreground">
                  {p.price}
                </div>
                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-sm border border-gold/30 bg-background/90 px-3 py-1 text-[11px] font-semibold tracking-wide backdrop-blur-sm">
                  <ShieldCheck size={12} className="text-gold" />
                  {p.verification}
                </div>
              </div>
              <div className="p-6">
                <h3 className="mb-2 font-serif text-lg font-semibold transition-colors group-hover:text-gold">{p.title}</h3>
                <div className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin size={14} className="text-gold" />
                  {p.location}
                </div>
                {p.threeWordLocation && <div className="mb-4 text-xs font-semibold text-gold">///{p.threeWordLocation}</div>}
                <div className="mb-4 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileCheck size={13} className="text-gold" />
                    {p.documents}
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers3 size={13} className="text-gold" />
                    {p.shares}
                  </div>
                  <div className="flex items-center gap-2">
                    <History size={13} className="text-gold" />
                    {p.history}
                  </div>
                  <div className="flex items-center gap-2 break-all">
                    <Wallet size={13} className="text-gold" />
                    Seller {shortWallet(p.wallet)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {searchQuery && !filteredProperties.length && (
          <div className="mt-8 rounded-lg border border-border bg-background/60 px-4 py-6 text-center text-sm text-muted-foreground">
            No matching property listings found.
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertiesSection;
