"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Check, Star, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  badge?: string;
}

const plans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for casual users exploring AI-generated content",
    monthlyPrice: 10,
    yearlyPrice: 100,
    icon: <Star className="h-6 w-6" />,
    features: ["300 images per month"],
  },
  {
    id: "unlimited",
    name: "Unlimited",
    description: "Ideal for regular content creators and enthusiasts",
    monthlyPrice: 20,
    yearlyPrice: 200,
    popular: true,
    icon: <Zap className="h-6 w-6" />,
    badge: "Most Popular",
    features: ["Unlimited image generation"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Advanced features for power users and professionals",
    monthlyPrice: 50,
    yearlyPrice: 500,
    icon: <Crown className="h-6 w-6" />,
    badge: "Pro",
    features: [
      "Unlimited image generation",
      "Private content creation",
      "Custom image parameters",
      "Bulk image generation",
      "Custom image sizes",
      "Turn on and off LoRA models",
    ],
  },
];

export function PricingClient() {
  const [isYearly, setIsYearly] = useState(false);

  const getPrice = (plan: PricingPlan) => {
    return isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const getDiscountPercentage = (plan: PricingPlan) => {
    const monthlyTotal = plan.monthlyPrice * 12;
    const yearlyPrice = plan.yearlyPrice;
    return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
  };

  const scrollToPricing = () => {
    const pricingSection = document.getElementById("pricing-plans");
    if (pricingSection) {
      const elementPosition =
        pricingSection.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - 150; // Adjust to show toggle + 10px above it

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Unlock the full potential of AI-generated content creation with our
            flexible pricing plans designed for every need.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                !isYearly ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isYearly ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-background transition-transform",
                  isYearly ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                isYearly ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Yearly
            </span>
            {isYearly && (
              <div className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 px-2 py-1 rounded-full text-xs font-medium ml-2">
                Save up to 17%
              </div>
            )}
          </div>

          {/* Pricing Cards */}
          <div
            id="pricing-plans"
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  "relative transition-all duration-300 hover:shadow-lg hover:scale-105",
                  plan.popular
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : "border-border"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium text-white",
                        plan.popular ? "bg-primary" : "bg-foreground"
                      )}
                    >
                      {plan.badge}
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-8">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4",
                      plan.popular
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {plan.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-foreground">
                        ${getPrice(plan)}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        /{isYearly ? "year" : "month"}
                      </span>
                    </div>
                    {isYearly && (
                      <div className="text-sm text-muted-foreground">
                        Save {getDiscountPercentage(plan)}% vs monthly
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    className="w-full"
                  >
                    Get Started
                  </Button>

                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-foreground">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Can I change my plan anytime?
                </h3>
                <p className="text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time.
                  Changes will be prorated and reflected in your next billing
                  cycle.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-muted-foreground">
                  We currently accept Visa and Mastercard credit and debit cards
                  for all subscription plans.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Is there a free trial available?
                </h3>
                <p className="text-muted-foreground">
                  Yes! All users receive 5 free image generations upon
                  registration, plus one additional free image every day to
                  explore our platform.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  What happens to my content if I cancel?
                </h3>
                <p className="text-muted-foreground">
                  Your generated content will remain in your account. You can
                  manage and delete your content at any time, or request
                  complete account deletion through our support team.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Do you offer refunds?
                </h3>
                <p className="text-muted-foreground">
                  We do not offer refunds on subscription plans. However, you
                  can cancel your subscription at any time to prevent future
                  charges.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Can I use generated content commercially?
                </h3>
                <p className="text-muted-foreground">
                  Yes, you have full commercial usage rights for all content
                  generated through our platform across all subscription plans.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Start Creating?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are already using PornSpot.ai to
              bring their imagination to life.
            </p>
            <Button
              size="lg"
              className="text-lg px-8 py-3"
              onClick={scrollToPricing}
            >
              Start Your Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
