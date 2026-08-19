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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {friend ? `Edit ${friend.name}` : "Add a friend"}
          </DialogTitle>
          <DialogDescription>
            Fill in what you know today — you can keep adding details over time.
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
            <Field label="Name" required>
              <Input value={values.name} onChange={(e) => set("name", e.target.value)} required />
            </Field>
            <Field label="Nickname">
              <Input value={values.nickname} onChange={(e) => set("nickname", e.target.value)} />
            </Field>
            <Field label="Birthday">
              <Input
                type="date"
                value={values.birthday}
                onChange={(e) => set("birthday", e.target.value)}
              />
            </Field>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={!values.birthday_has_year}
                  onCheckedChange={(checked) => set("birthday_has_year", !checked)}
                />
                I don't know the year
              </label>
            </div>
            <Field label="Email">
              <Input
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input value={values.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Favourite colour">
              <Input
                value={values.favorite_color}
                onChange={(e) => set("favorite_color", e.target.value)}
              />
            </Field>
            <Field label="Photo URL">
              <Input value={values.photo_url} onChange={(e) => set("photo_url", e.target.value)} />
            </Field>
            <Field label="Clothing size">
              <Input
                value={values.clothing_size}
                onChange={(e) => set("clothing_size", e.target.value)}
              />
            </Field>
            <Field label="Shoe size">
              <Input value={values.shoe_size} onChange={(e) => set("shoe_size", e.target.value)} />
            </Field>
          </div>

          <Field label="Favourite foods & drinks">
            <Textarea
              rows={2}
              value={values.favorite_foods}
              onChange={(e) => set("favorite_foods", e.target.value)}
            />
          </Field>
          <Field label="Favourite music, films, books">
            <Textarea
              rows={2}
              value={values.favorite_media}
              onChange={(e) => set("favorite_media", e.target.value)}
            />
          </Field>
          <Field label="Wishlist / things they've hinted at">
            <Textarea
              rows={2}
              value={values.wishlist}
              onChange={(e) => set("wishlist", e.target.value)}
            />
          </Field>
          <Field label="Dislikes & allergies">
            <Textarea
              rows={2}
              value={values.dislikes}
              onChange={(e) => set("dislikes", e.target.value)}
            />
          </Field>
          <Field label="How we met">
            <Input value={values.how_we_met} onChange={(e) => set("how_we_met", e.target.value)} />
          </Field>
          <Field label="Anything else">
            <Textarea rows={2} value={values.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>

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
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
