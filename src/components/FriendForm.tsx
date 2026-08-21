import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "@/lib/queries";
import type { Friend } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const COLOR_OPTIONS = ["Blue", "Green", "Red", "Yellow", "Purple", "Black", "Pink"];
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const FOOD_SUGGESTIONS = ["Coffee", "Chocolate", "Sushi", "Spicy food", "Tea", "Cheese"];
const MEDIA_SUGGESTIONS = ["Podcasts", "Sci-fi", "Rom-coms", "Fiction", "Live music", "Anime"];
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface FriendFormValues {
  name: string;
  nickname: string;
  birthday: string;
  birthday_has_year: boolean;
  email: string;
  phone: string;
  photo_url: string;
  favorite_color: string;
  favorite_foods: string;
  favorite_media: string;
  wishlist: string;
  dislikes: string;
  clothing_size: string;
  shoe_size: string;
  how_we_met: string;
  notes: string;
}

function toValues(friend?: Friend | null): FriendFormValues {
  return {
    name: friend?.name ?? "",
    nickname: friend?.nickname ?? "",
    birthday: friend?.birthday ?? "",
    birthday_has_year: friend?.birthday_has_year ?? true,
    email: friend?.email ?? "",
    phone: friend?.phone ?? "",
    photo_url: friend?.photo_url ?? "",
    favorite_color: friend?.favorite_color ?? "",
    favorite_foods: friend?.favorite_foods ?? "",
    favorite_media: friend?.favorite_media ?? "",
    wishlist: friend?.wishlist ?? "",
    dislikes: friend?.dislikes ?? "",
    clothing_size: friend?.clothing_size ?? "",
    shoe_size: friend?.shoe_size ?? "",
    how_we_met: friend?.how_we_met ?? "",
    notes: friend?.notes ?? "",
  };
}

const nullify = (value: string) => (value.trim() === "" ? null : value.trim());

export function FriendForm({
  open,
  onOpenChange,
  friend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friend?: Friend | null;
}) {
  const [values, setValues] = useState<FriendFormValues>(() => toValues(friend));
  const [formKey, setFormKey] = useState(friend?.id ?? "new");
  const queryClient = useQueryClient();

  if (open && formKey !== (friend?.id ?? "new")) {
    setFormKey(friend?.id ?? "new");
    setValues(toValues(friend));
  }

  const set = <K extends keyof FriendFormValues>(key: K, value: FriendFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: values.name.trim(),
        nickname: nullify(values.nickname),
        birthday: nullify(values.birthday),
        birthday_has_year: values.birthday_has_year,
        email: nullify(values.email),
        phone: nullify(values.phone),
        photo_url: nullify(values.photo_url),
        favorite_color: nullify(values.favorite_color),
        favorite_foods: nullify(values.favorite_foods),
        favorite_media: nullify(values.favorite_media),
        wishlist: nullify(values.wishlist),
        dislikes: nullify(values.dislikes),
        clothing_size: nullify(values.clothing_size),
        shoe_size: nullify(values.shoe_size),
        how_we_met: nullify(values.how_we_met),
        notes: nullify(values.notes),
      };

      if (friend) {
        const { error } = await supabase.from("friends").update(payload).eq("id", friend.id);
        if (error) throw new Error(error.message);
        return friend.id;
      }
      const user_id = await currentUserId();
      const { data, error } = await supabase
        .from("friends")
        .insert({ ...payload, user_id })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data.id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend", id] });
      toast.success(friend ? "Profile updated" : "Friend added");
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filled = [
    values.nickname,
    values.birthday,
    values.email,
    values.phone,
    values.favorite_color,
    values.favorite_foods,
    values.favorite_media,
    values.wishlist,
    values.dislikes,
    values.clothing_size,
    values.shoe_size,
    values.how_we_met,
    values.notes,
  ].filter((v) => v.trim() !== "").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {friend ? `Edit ${friend.name}` : "Add a friend"}
          </DialogTitle>
          <DialogDescription>
            Only the name is required. Everything else is optional — {filled} of 13 extra details
            added so far.
          </DialogDescription>
        </DialogHeader>


        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!values.name.trim()) {
              toast.error("A name is required.");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required hint="How you'd call them in a message">
              <Input
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Aisha Rasheed"
                autoFocus
                required
              />
            </Field>
            <Field label="Nickname">
              <Input
                value={values.nickname}
                onChange={(e) => set("nickname", e.target.value)}
                placeholder="e.g. Ish"
              />
            </Field>
            <Field label="Birthday" hint="Tick below if you only know day & month">
              <Input
                type="date"
                value={values.birthday}
                onChange={(e) => set("birthday", e.target.value)}
              />
            </Field>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={!values.birthday_has_year}
                  onCheckedChange={(checked) => set("birthday_has_year", !checked)}
                />
                I don't know the year
              </label>
            </div>
          </div>

          <Accordion type="multiple" defaultValue={["favourites"]} className="w-full">
            <AccordionItem value="contact">
              <AccordionTrigger className="font-display text-sm">Contact & photo</AccordionTrigger>
              <AccordionContent className="grid gap-4 pt-1 sm:grid-cols-2">
                <Field label="Email">
                  <Input
                    type="email"
                    inputMode="email"
                    value={values.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="name@example.com"
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    type="tel"
                    inputMode="tel"
                    value={values.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+960 777 1234"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Photo URL" hint="Paste a link to a picture of them">
                    <Input
                      type="url"
                      value={values.photo_url}
                      onChange={(e) => set("photo_url", e.target.value)}
                      placeholder="https://…"
                    />
                  </Field>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="favourites">
              <AccordionTrigger className="font-display text-sm">
                Favourites & interests
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-1">
                <Field label="Favourite colour">
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <Chip
                        key={color}
                        active={values.favorite_color.toLowerCase() === color.toLowerCase()}
                        onClick={() =>
                          set(
                            "favorite_color",
                            values.favorite_color.toLowerCase() === color.toLowerCase() ? "" : color,
                          )
                        }
                      >
                        {color}
                      </Chip>
                    ))}
                  </div>
                  <Input
                    className="mt-2"
                    value={values.favorite_color}
                    onChange={(e) => set("favorite_color", e.target.value)}
                    placeholder="or type another colour"
                  />
                </Field>

                <Field label="Favourite foods & drinks" hint="Separate with commas">
                  <Textarea
                    rows={2}
                    value={values.favorite_foods}
                    onChange={(e) => set("favorite_foods", e.target.value)}
                    placeholder="Sushi, oat flat white, dark chocolate"
                  />
                  <Suggestions
                    options={FOOD_SUGGESTIONS}
                    onPick={(text) => append("favorite_foods", text)}
                  />
                </Field>

                <Field label="Music, films, books" hint="Separate with commas">
                  <Textarea
                    rows={2}
                    value={values.favorite_media}
                    onChange={(e) => set("favorite_media", e.target.value)}
                    placeholder="Fleetwood Mac, Studio Ghibli, crime novels"
                  />
                  <Suggestions
                    options={MEDIA_SUGGESTIONS}
                    onPick={(text) => append("favorite_media", text)}
                  />
                </Field>

                <Field label="Wishlist" hint="Things they've hinted at wanting">
                  <Textarea
                    rows={2}
                    value={values.wishlist}
                    onChange={(e) => set("wishlist", e.target.value)}
                    placeholder="A good rain jacket, pottery class"
                  />
                </Field>

                <Field label="Dislikes & allergies">
                  <Textarea
                    rows={2}
                    value={values.dislikes}
                    onChange={(e) => set("dislikes", e.target.value)}
                    placeholder="Nut allergy, doesn't drink alcohol"
                  />
                </Field>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sizes">
              <AccordionTrigger className="font-display text-sm">Sizes</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-1">
                <Field label="Clothing size">
                  <div className="flex flex-wrap gap-2">
                    {CLOTHING_SIZES.map((size) => (
                      <Chip
                        key={size}
                        active={values.clothing_size === size}
                        onClick={() =>
                          set("clothing_size", values.clothing_size === size ? "" : size)
                        }
                      >
                        {size}
                      </Chip>
                    ))}
                  </div>
                  <Input
                    className="mt-2"
                    value={values.clothing_size}
                    onChange={(e) => set("clothing_size", e.target.value)}
                    placeholder="or type a size"
                  />
                </Field>
                <Field label="Shoe size">
                  <Input
                    value={values.shoe_size}
                    onChange={(e) => set("shoe_size", e.target.value)}
                    placeholder="e.g. UK 8 / EU 42"
                  />
                </Field>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="story">
              <AccordionTrigger className="font-display text-sm">Your story</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-1">
                <Field label="How we met">
                  <Input
                    value={values.how_we_met}
                    onChange={(e) => set("how_we_met", e.target.value)}
                    placeholder="University, 2016"
                  />
                </Field>
                <Field label="Anything else">
                  <Textarea
                    rows={2}
                    value={values.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="Loves surprise plans, hates loud restaurants"
                  />
                </Field>
              </AccordionContent>
            </AccordionItem>
          </Accordion>


          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {friend ? "Save changes" : "Add friend"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-secondary text-secondary-foreground hover:border-primary/50",
      )}
    >
      {children}
    </button>
  );
}

function Suggestions({ options, onPick }: { options: string[]; onPick: (text: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {options.map((option) => (
        <Chip key={option} onClick={() => onPick(option)}>
          + {option}
        </Chip>
      ))}
    </div>
  );
}
