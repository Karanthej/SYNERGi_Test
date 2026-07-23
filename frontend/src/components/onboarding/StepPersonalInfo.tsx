import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  linkedin: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  portfolio: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  profilePhoto: z.any().optional(), // In a real app, handle file validation
});

type FormValues = z.infer<typeof personalInfoSchema>;

interface Props {
  onNext: () => void;
}

export default function StepPersonalInfo({ onNext }: Props) {
  const { personalInfo, setPersonalInfo } = useOnboardingStore();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: personalInfo,
  });

  const onSubmit = (data: FormValues) => {
    setPersonalInfo(data);
    onNext();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold">Personal Information</h2>
        <p className="text-muted-foreground">Tell us a bit about yourself.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input {...register("fullName")} placeholder="John Doe" className={errors.fullName ? "border-destructive" : ""} />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register("email")} placeholder="john@example.com" className={errors.email ? "border-destructive" : ""} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input type="tel" {...register("phone")} placeholder="+1 234 567 8900" className={errors.phone ? "border-destructive" : ""} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input type="date" {...register("dob")} className={errors.dob ? "border-destructive" : ""} />
            {errors.dob && <p className="text-sm text-destructive">{errors.dob.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <Select onValueChange={(v) => setValue("gender", v)} defaultValue={personalInfo.gender}>
              <SelectTrigger className={errors.gender ? "border-destructive" : ""}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Country</Label>
            <Input {...register("country")} placeholder="e.g. USA" className={errors.country ? "border-destructive" : ""} />
            {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>State/Province</Label>
            <Input {...register("state")} placeholder="e.g. California" className={errors.state ? "border-destructive" : ""} />
            {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>City</Label>
            <Input {...register("city")} placeholder="e.g. San Francisco" className={errors.city ? "border-destructive" : ""} />
            {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>LinkedIn URL (Optional)</Label>
            <Input type="url" {...register("linkedin")} placeholder="https://linkedin.com/in/..." className={errors.linkedin ? "border-destructive" : ""} />
            {errors.linkedin && <p className="text-sm text-destructive">{errors.linkedin.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Portfolio URL (Optional)</Label>
            <Input type="url" {...register("portfolio")} placeholder="https://yourwebsite.com" className={errors.portfolio ? "border-destructive" : ""} />
            {errors.portfolio && <p className="text-sm text-destructive">{errors.portfolio.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Profile Photo (Optional)</Label>
          <Input type="file" accept="image/*" {...register("profilePhoto")} />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit">Next Step</Button>
        </div>
      </form>
    </motion.div>
  );
}
