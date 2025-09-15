import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  TrendingUp, 
  MapPin, 
  Home, 
  Loader2,
  DollarSign,
  BarChart3,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PredictionResult {
  estimatedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidence: number;
  factors: {
    location: number;
    size: number;
    bedrooms: number;
    bathrooms: number;
    amenities: number;
    market: number;
  };
  comparableProperties: Array<{
    price: number;
    distance: string;
    similarity: number;
  }>;
}

const PricePrediction = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  
  const [formData, setFormData] = useState({
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    yearBuilt: '',
    parkingSpaces: '',
    furnished: false,
    petFriendly: false,
    amenities: [] as string[],
  });

  const amenitiesList = [
    'Swimming Pool', 'Gym', 'Parking', 'Security', 'Elevator', 'Balcony',
    'Garden', 'Garage', 'Fireplace', 'Walk-in Closet', 'Laundry',
    'Air Conditioning', 'Heating', 'Hardwood Floors', 'Updated Kitchen'
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: checked 
        ? [...prev.amenities, amenity]
        : prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.propertyType || !formData.bedrooms || !formData.bathrooms || 
        !formData.area || !formData.city || !formData.state) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Call our edge function for price prediction
      const { data, error } = await supabase.functions.invoke('predict-price', {
        body: formData
      });

      if (error) {
        throw error;
      }

      setPrediction(data.prediction);
      
      toast({
        title: "Price prediction generated!",
        description: "Your property valuation is ready.",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Prediction failed",
        description: "Unable to generate price prediction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const resetForm = () => {
    setFormData({
      propertyType: '',
      bedrooms: '',
      bathrooms: '',
      area: '',
      address: '',
      city: '',
      state: '',
      zipcode: '',
      yearBuilt: '',
      parkingSpaces: '',
      furnished: false,
      petFriendly: false,
      amenities: [],
    });
    setPrediction(null);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Calculator className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          AI Price Prediction
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get accurate property valuations using advanced AI algorithms and comprehensive market data analysis
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <Card className="border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Home className="h-5 w-5 mr-2" />
              Property Details
            </CardTitle>
            <CardDescription>
              Enter your property information for an accurate price estimation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Type */}
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type *</Label>
                <Select 
                  value={formData.propertyType} 
                  onValueChange={(value) => handleInputChange('propertyType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms *</Label>
                  <Select 
                    value={formData.bedrooms} 
                    onValueChange={(value) => handleInputChange('bedrooms', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bedrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Studio</SelectItem>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4 Bedrooms</SelectItem>
                      <SelectItem value="5">5+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms *</Label>
                  <Select 
                    value={formData.bathrooms} 
                    onValueChange={(value) => handleInputChange('bathrooms', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bathrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Bathroom</SelectItem>
                      <SelectItem value="1.5">1.5 Bathrooms</SelectItem>
                      <SelectItem value="2">2 Bathrooms</SelectItem>
                      <SelectItem value="2.5">2.5 Bathrooms</SelectItem>
                      <SelectItem value="3">3 Bathrooms</SelectItem>
                      <SelectItem value="4">4+ Bathrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Area */}
              <div className="space-y-2">
                <Label htmlFor="area">Total Area (sq ft) *</Label>
                <Input
                  id="area"
                  type="number"
                  placeholder="e.g., 1200"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                />
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Street address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      type="text"
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipcode">ZIP Code</Label>
                    <Input
                      id="zipcode"
                      type="text"
                      placeholder="ZIP Code"
                      value={formData.zipcode}
                      onChange={(e) => handleInputChange('zipcode', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input
                      id="yearBuilt"
                      type="number"
                      placeholder="e.g., 2020"
                      value={formData.yearBuilt}
                      onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Features */}
              <div className="space-y-2">
                <Label htmlFor="parkingSpaces">Parking Spaces</Label>
                <Select 
                  value={formData.parkingSpaces} 
                  onValueChange={(value) => handleInputChange('parkingSpaces', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Number of parking spaces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Parking</SelectItem>
                    <SelectItem value="1">1 Space</SelectItem>
                    <SelectItem value="2">2 Spaces</SelectItem>
                    <SelectItem value="3">3+ Spaces</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="furnished"
                    checked={formData.furnished}
                    onCheckedChange={(checked) => handleInputChange('furnished', !!checked)}
                  />
                  <Label htmlFor="furnished">Furnished</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="petFriendly"
                    checked={formData.petFriendly}
                    onCheckedChange={(checked) => handleInputChange('petFriendly', !!checked)}
                  />
                  <Label htmlFor="petFriendly">Pet Friendly</Label>
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-3">
                <Label>Amenities</Label>
                <div className="grid grid-cols-2 gap-2">
                  {amenitiesList.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={formData.amenities.includes(amenity)}
                        onCheckedChange={(checked) => handleAmenityChange(amenity, !!checked)}
                      />
                      <Label htmlFor={amenity} className="text-sm">{amenity}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Get Price Prediction
                    </>
                  )}
                </Button>
                
                <Button type="button" variant="outline" onClick={resetForm}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {prediction ? (
            <>
              {/* Main Prediction */}
              <Card className="border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-primary">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Estimated Value
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold text-primary">
                      {formatPrice(prediction.estimatedPrice)}
                    </div>
                    <div className="text-muted-foreground">
                      Range: {formatPrice(prediction.priceRange.min)} - {formatPrice(prediction.priceRange.max)}
                    </div>
                    <Badge variant="secondary">
                      {prediction.confidence}% Confidence
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Price Factors */}
              <Card className="border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Price Factors
                  </CardTitle>
                  <CardDescription>
                    How different factors influence your property value
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(prediction.factors).map(([factor, score]) => (
                      <div key={factor} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">
                            {factor === 'bedrooms' ? 'Bedrooms & Layout' : factor}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(score)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comparable Properties */}
              <Card className="border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Comparable Properties
                  </CardTitle>
                  <CardDescription>
                    Similar properties in your area
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prediction.comparableProperties.map((comp, index) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded-lg border">
                        <div>
                          <div className="font-medium">{formatPrice(comp.price)}</div>
                          <div className="text-sm text-muted-foreground">{comp.distance}</div>
                        </div>
                        <Badge variant="outline">
                          {comp.similarity}% match
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Placeholder */
            <Card className="border-border/50 shadow-card">
              <CardContent className="text-center py-12">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Ready for Your Prediction?
                </h3>
                <p className="text-muted-foreground mb-4">
                  Fill out the property details to get an AI-powered price estimate
                </p>
                <div className="bg-muted/50 rounded-lg p-4 text-left">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-primary mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">How it works:</p>
                      <ul className="space-y-1">
                        <li>• AI analyzes comparable properties</li>
                        <li>• Market trends and location data</li>
                        <li>• Property features and amenities</li>
                        <li>• Real-time market conditions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricePrediction;