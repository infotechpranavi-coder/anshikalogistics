import { PageHeader } from "@/components/shared/page-header";
import { Avatar,AvatarFallback,AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/session";
export default async function ProfilePage(){const user=await requireAuth();return <div className="space-y-6"><PageHeader title="Profile" description="Your Anshika Logistics account details."/><Card className="max-w-2xl"><CardHeader><CardTitle>Account</CardTitle></CardHeader><CardContent className="flex items-start gap-5"><Avatar className="h-16 w-16"><AvatarImage src={user.image??undefined}/><AvatarFallback className="bg-teal-100 text-teal-800">{user.name?.slice(0,2).toUpperCase()}</AvatarFallback></Avatar><div className="space-y-2"><h2 className="text-xl font-semibold">{user.name}</h2><p className="text-slate-600">{user.email}</p><Badge variant="outline">{user.role}</Badge></div></CardContent></Card></div>}
