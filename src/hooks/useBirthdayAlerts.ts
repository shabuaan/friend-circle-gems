import { useQuery } from "@tanstack/react-query";
import { friendsQuery, wishesQuery } from "@/lib/queries";
import { getBirthdayInfo } from "@/lib/birthday";

/** Number of friends with an upcoming (<=30 days) or unwished overdue (<=14 days) birthday. */
export function useBirthdayAlertCount(): number {
  const friends = useQuery(friendsQuery());
  const wishes = useQuery(wishesQuery());

  const wished = new Set((wishes.data ?? []).map((w) => `${w.friend_id}:${w.year}`));

  return (friends.data ?? []).reduce((count, friend) => {
    const info = getBirthdayInfo(friend.birthday, friend.birthday_has_year);
    if (!info) return count;
    const upcoming = info.daysUntil <= 30;
    const overdue =
      info.daysSincePrevious <= 14 && !wished.has(`${friend.id}:${info.previous.getFullYear()}`);
    return upcoming || overdue ? count + 1 : count;
  }, 0);
}
