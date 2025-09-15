import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  TrendingUp, 
  Heart, 
  Star, 
  Calculator,
  MessageSquare,
  ArrowRight,
  Home as HomeIcon,
  Building,
  DollarSign,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Database } from "@/integrations/supabase/types";

type Property = Database['public']['Tables']['properties']['Row'];

const Home = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

  const fetchFeaturedProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .limit(6);

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setFeaturedProperties(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/properties?search=${encodeURIComponent(searchQuery.trim())}`;
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

  const stats = [
    { icon: HomeIcon, label: "Properties Listed", value: "10,000+", color: "text-primary" },
    { icon: Users, label: "Happy Customers", value: "5,000+", color: "text-accent" },
    { icon: DollarSign, label: "Properties Sold", value: "$2.5B+", color: "text-success" },
    { icon: Building, label: "Cities Covered", value: "50+", color: "text-warning" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 px-4">
        <div className="container max-w-6xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              Find Your Dream Home with
              <span className="text-primary"> AI Intelligence</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover perfect properties with our AI-powered search, get accurate price predictions, 
              and connect with your ideal home faster than ever before.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by location, property type, or price range..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg border-border/50 focus:border-primary shadow-card"
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 shadow-card">
                Search Properties
              </Button>
            </div>
          </form>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" size="lg" asChild className="shadow-card">
              <Link to="/map">
                <MapPin className="mr-2 h-5 w-5" />
                Browse on Map
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="shadow-card">
              <Link to="/price-prediction">
                <Calculator className="mr-2 h-5 w-5" />
                Price Prediction
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="shadow-card">
              <Link to="/chat">
                <MessageSquare className="mr-2 h-5 w-5" />
                AI Assistant
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <stat.icon className={`h-8 w-8 mx-auto ${stat.color}`} />
                <div className="space-y-1">
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Featured Properties
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our handpicked selection of premium properties
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg"></div>
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <Card key={property.id} className="group hover:shadow-card transition-all duration-300 border-border/50">
                  <div className="relative overflow-hidden">
                    <img
                      src={Array.isArray(property.images) && property.images.length > 0 ? String(property.images[0]) : '/placeholder.svg'}
                      alt={property.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-3 left-3 bg-primary">
                      {String(property.property_type)}
                    </Badge>
                    {user && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 h-8 w-8 bg-background/80 hover:bg-background"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <CardHeader>
                    <div className="space-y-2">
                      <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {property.title}
                      </CardTitle>
                      <CardDescription className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.city}, {property.state}
                      </CardDescription>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(property.price)}
                      </span>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{property.bedrooms} bed</span>
                        <span>•</span>
                        <span>{property.bathrooms} bath</span>
                        <span>•</span>
                        <span>{property.area_sqft} sqft</span>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center">
            <Button size="lg" asChild className="shadow-card">
              <Link to="/properties">
                View All Properties
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="container max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              AI-Powered Real Estate Experience
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of property search with our advanced AI tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center space-y-4 p-6 border-border/50 shadow-card">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardHeader className="p-0">
                <CardTitle className="text-xl">Price Prediction</CardTitle>
                <CardDescription>
                  Get accurate property valuations using advanced AI algorithms and market data
                </CardDescription>
              </CardHeader>
              <Button variant="outline" asChild className="w-full">
                <Link to="/price-prediction">Try Price Prediction</Link>
              </Button>
            </Card>

            <Card className="text-center space-y-4 p-6 border-border/50 shadow-card">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
                <MessageSquare className="h-6 w-6 text-accent" />
              </div>
              <CardHeader className="p-0">
                <CardTitle className="text-xl">AI Assistant</CardTitle>
                <CardDescription>
                  Get instant answers about properties, neighborhoods, and market trends
                </CardDescription>
              </CardHeader>
              <Button variant="outline" asChild className="w-full">
                <Link to="/chat">Chat with AI</Link>
              </Button>
            </Card>

            <Card className="text-center space-y-4 p-6 border-border/50 shadow-card">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto">
                <Star className="h-6 w-6 text-success" />
              </div>
              <CardHeader className="p-0">
                <CardTitle className="text-xl">Smart Matching</CardTitle>
                <CardDescription>
                  Receive personalized property recommendations based on your preferences
                </CardDescription>
              </CardHeader>
              <Button variant="outline" asChild className="w-full">
                <Link to="/properties">Start Browsing</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 px-4">
          <div className="container max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Ready to Find Your Dream Home?
              </h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of satisfied customers and discover your perfect property today
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="shadow-card">
                <Link to="/auth">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="shadow-card">
                <Link to="/properties">Browse Properties</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;