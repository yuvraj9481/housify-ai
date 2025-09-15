import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  MapPin, 
  Heart, 
  Filter,
  Grid3X3,
  List,
  ArrowUpDown,
  Bed,
  Bath,
  Maximize,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Property = Database['public']['Tables']['properties']['Row'];

const Properties = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
  // Filters
  const [filters, setFilters] = useState({
    propertyType: '',
    priceRange: [0, 5000000] as [number, number],
    bedrooms: '',
    bathrooms: '',
    minArea: '',
    maxArea: '',
    city: '',
    amenities: [] as string[],
  });
  
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProperties();
    if (user) {
      fetchFavorites();
    }
  }, [filters, sortBy, sortOrder, searchQuery]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'available');

      // Apply search
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
      }

      // Apply filters
      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType);
      }
      
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      
      if (filters.bedrooms) {
        query = query.eq('bedrooms', parseInt(filters.bedrooms));
      }
      
      if (filters.bathrooms) {
        query = query.eq('bathrooms', parseInt(filters.bathrooms));
      }
      
      if (filters.minArea) {
        query = query.gte('area_sqft', parseInt(filters.minArea));
      }
      
      if (filters.maxArea) {
        query = query.lte('area_sqft', parseInt(filters.maxArea));
      }

      // Price range filter
      query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: "Error loading properties",
          description: "Please try again later.",
          variant: "destructive",
        });
      } else {
        setProperties(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('property_id')
        .eq('user_id', user!.id);

      if (error) {
        console.error('Error fetching favorites:', error);
      } else {
        setFavorites(new Set(data.map(fav => fav.property_id)));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save properties.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (favorites.has(propertyId)) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);
        
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(propertyId);
          return newSet;
        });
        
        toast({
          title: "Removed from favorites",
          description: "Property removed from your saved list.",
        });
      } else {
        await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, property_id: propertyId });
        
        setFavorites(prev => new Set(prev).add(propertyId));
        
        toast({
          title: "Added to favorites",
          description: "Property saved to your favorites!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    }
  };

  const trackPropertyView = async (propertyId: string) => {
    try {
      await supabase
        .from('property_views')
        .insert({ 
          property_id: propertyId,
          user_id: user?.id || null,
          session_id: sessionStorage.getItem('session_id') || Math.random().toString(36)
        });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(searchQuery ? { search: searchQuery } : {});
  };

  const clearFilters = () => {
    setFilters({
      propertyType: '',
      priceRange: [0, 5000000],
      bedrooms: '',
      bathrooms: '',
      minArea: '',
      maxArea: '',
      city: '',
      amenities: [],
    });
    setSearchQuery('');
    setSearchParams({});
  };

  const PropertyCard = ({ property }: { property: Property }) => (
    <Card className="group hover:shadow-card transition-all duration-300 border-border/50">
      <div className="relative overflow-hidden">
        <img
          src={Array.isArray(property.images) && property.images.length > 0 ? String(property.images[0]) : '/placeholder.svg'}
          alt={property.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge className="absolute top-3 left-3 bg-primary">
          {String(property.property_type)}
        </Badge>
        <div className="absolute top-3 right-3 flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background/80 hover:bg-background"
            onClick={() => trackPropertyView(property.id)}
            asChild
          >
            <Link to={`/property/${property.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 bg-background/80 hover:bg-background ${
              favorites.has(property.id) ? 'text-red-500' : ''
            }`}
            onClick={() => toggleFavorite(property.id)}
          >
            <Heart className={`h-4 w-4 ${favorites.has(property.id) ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>
      <CardHeader>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
            {property.title}
          </h3>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{property.city}, {property.state}</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-2xl font-bold text-primary">
            {formatPrice(property.price)}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-1" />
                <span>{property.bedrooms}</span>
              </div>
              <div className="flex items-center">
                <Bath className="h-4 w-4 mr-1" />
                <span>{property.bathrooms}</span>
              </div>
              <div className="flex items-center">
                <Maximize className="h-4 w-4 mr-1" />
                <span>{property.area_sqft} sqft</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="space-y-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Properties</h1>
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `${properties.length} properties found`}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
          
          <div className="flex items-center space-x-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Added</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="area_sqft">Size</SelectItem>
                <SelectItem value="bedrooms">Bedrooms</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className="w-80 space-y-6 hidden lg:block">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Property Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">Property Type</label>
                <Select value={filters.propertyType} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, propertyType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any type</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Price Range: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
                </label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))
                  }
                  max={5000000}
                  min={0}
                  step={50000}
                  className="mt-2"
                />
              </div>

              {/* Bedrooms */}
              <div>
                <label className="text-sm font-medium mb-2 block">Bedrooms</label>
                <Select value={filters.bedrooms} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, bedrooms: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="0">Studio</SelectItem>
                    <SelectItem value="1">1 Bedroom</SelectItem>
                    <SelectItem value="2">2 Bedrooms</SelectItem>
                    <SelectItem value="3">3 Bedrooms</SelectItem>
                    <SelectItem value="4">4 Bedrooms</SelectItem>
                    <SelectItem value="5">5+ Bedrooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bathrooms */}
              <div>
                <label className="text-sm font-medium mb-2 block">Bathrooms</label>
                <Select value={filters.bathrooms} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, bathrooms: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="1">1 Bathroom</SelectItem>
                    <SelectItem value="2">2 Bathrooms</SelectItem>
                    <SelectItem value="3">3 Bathrooms</SelectItem>
                    <SelectItem value="4">4+ Bathrooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Area */}
              <div className="space-y-4">
                <label className="text-sm font-medium block">Area (sq ft)</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minArea}
                    onChange={(e) => setFilters(prev => ({ ...prev, minArea: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxArea}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxArea: e.target.value }))}
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="text-sm font-medium mb-2 block">City</label>
                <Input
                  type="text"
                  placeholder="Enter city name"
                  value={filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Properties Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg"></div>
                  <CardHeader>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-6 bg-muted rounded w-1/4"></div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <div className="space-y-4">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No properties found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search criteria or clearing the filters
                  </p>
                </div>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'md:grid-cols-2 xl:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Properties;