"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { COUNTRIES_LIST } from "~/data/countries";
import { trpc } from "~/trpc/client";
import { SettingsFormValues, settingsSchema } from "~/validation/settings";

const Settings = () => {
  const utils = trpc.useUtils();
  const [settings] = trpc.settings.getAll.useSuspenseQuery();
  const updateSettingsMutation = trpc.settings.updateSettings.useMutation();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [countrySearchTerm, setCountrySearchTerm] = useState<string>("");

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      company_name: "My Company",
      address: "123 Main Street",
      city: "Harare",
      state: "",
      logo: "",
      country: "United States",
    },
  });

  useEffect(() => {
    if (settings) {
      Object.keys(settings).forEach((key) => {
        form.setValue(key as keyof SettingsFormValues, settings[key]);
      });
    }
  }, [settings, form.setValue]);

  const filteredCountries = useMemo(
    () =>
      COUNTRIES_LIST.filter((country) =>
        country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
      ),
    [countrySearchTerm, COUNTRIES_LIST]
  );

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          form.setValue("logo", reader.result as string);
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      await updateSettingsMutation.mutateAsync(data, {
        onSuccess: () => {
          toast.success("Settings updated successfully");
          utils.settings.getAll.invalidate();
        },
        onError: () => {
          toast.error("Failed to update settings");
        },
      });
    } catch (error) {
      console.error("Failed to update settings", error);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-3xl mx-auto"
      >
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Company Name" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        {/* Logo */}

        <FormField
          control={form.control}
          name="logo"
          render={() => (
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              </FormControl>
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
            </FormItem>
          )}
        />

        {/* address */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Address" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* city */}
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="City" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* state */}
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <FormControl>
                <Input placeholder="State" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* country */}
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <div>
                    <Input
                      placeholder="Search country..."
                      value={countrySearchTerm}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase();
                        setCountrySearchTerm(value);
                      }}
                    />
                  </div>
                  {filteredCountries.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={updateSettingsMutation.isPending}>
          {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
};

export default Settings;
