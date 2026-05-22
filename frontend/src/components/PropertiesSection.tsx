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
  { image: property1, title: "Apartment Registry Record", price: "Nu. 45,00,000", location: "Motithang, Thimphu", verification: "Approved record", documents: "12 documents hash-verified", shares: "2,500 shares available", history: "4 registry events", wallet: "0x8F2A1d3B4c5E6F7890123456789aBcDeF0123456", searchText: "apartment registry record motithang thimphu approved listing" },
  { image: property2, title: "Residential Share Record", price: "Nu. 850 / share", location: "Babesa, Thimphu", verification: "Approved record", documents: "Document hash anchored", shares: "2,500 shares available", history: "3 holder events", wallet: "0xa110000000000000000000000000000000000001", searchText: "residential share record babesa thimphu property shares partial listing" },
  { image: property3, title: "Urban Property Record", price: "Nu. 1,20,00,000", location: "Changlimithang, Thimphu", verification: "Approved record", documents: "11 documents hash-verified", shares: "10,000 full-property shares", history: "5 registry events", wallet: "0x8F2A1d3B4c5E6F7890123456789aBcDeF0123456", searchText: "urban property record changlimithang thimphu full property listing" },
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
  verification: `${listing.listingType} record`,
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
    <section id="registry" className="section-padding bg-background">
      <div className="container mx-auto">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-sm font-bold uppercase tracking-widest text-[#7a1f2f]">Public registry snapshot</span>
            <h2 className="mt-3 text-3xl font-extrabold text-primary md:text-4xl">
              Verified property records and available ownership shares.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-right">
            Listings shown here are approved service records with document proof references, share availability, and wallet-based ownership history.
          </p>
        </div>

        {isLoading && (
          <div className="mb-8 border border-border bg-white px-4 py-3 text-sm text-muted-foreground">
            Loading verified property records from the backend registry...
          </div>
        )}

        {searchQuery && !isLoading && (
          <div className="mb-8 flex flex-col gap-3 border border-border bg-white px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {filteredProperties.length} record{filteredProperties.length === 1 ? "" : "s"} for "{searchQuery}".
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="w-fit text-xs font-bold uppercase tracking-widest text-[#7a1f2f] hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((p, i) => (
            <div
              key={`${p.title}-${i}`}
              className="group overflow-hidden border border-border bg-white shadow-sm transition-colors hover:border-gold-dark/50"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute right-4 top-4 rounded-sm bg-primary px-3 py-1 text-xs font-bold tracking-wider text-primary-foreground">
                  {p.price}
                </div>
                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-sm border border-emerald-700/30 bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800 backdrop-blur-sm">
                  <ShieldCheck size={12} className="text-gold" />
                  {p.verification}
                </div>
              </div>
              <div className="p-6">
                <h3 className="mb-2 text-lg font-bold text-primary transition-colors group-hover:text-[#7a1f2f]">{p.title}</h3>
                <div className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin size={14} className="text-gold-dark" />
                  {p.location}
                </div>
                {p.threeWordLocation && <div className="mb-4 text-xs font-semibold text-[#7a1f2f]">///{p.threeWordLocation}</div>}
                <div className="mb-4 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileCheck size={13} className="text-gold-dark" />
                    {p.documents}
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers3 size={13} className="text-gold-dark" />
                    {p.shares}
                  </div>
                  <div className="flex items-center gap-2">
                    <History size={13} className="text-gold-dark" />
                    {p.history}
                  </div>
                  <div className="flex items-center gap-2 break-all">
                    <Wallet size={13} className="text-gold-dark" />
                    Seller {shortWallet(p.wallet)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {searchQuery && !filteredProperties.length && (
          <div className="mt-8 border border-border bg-white px-4 py-6 text-center text-sm text-muted-foreground">
            No matching property records found.
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertiesSection;
