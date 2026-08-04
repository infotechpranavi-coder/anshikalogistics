import { getUsers } from "@/actions/users";
import { PageHeader } from "@/components/shared/page-header";
import { UsersManager } from "@/features/users/users-manager";
export default async function UsersPage(){const users=(await getUsers()).data??[];return <div className="space-y-6"><PageHeader title="Users" description="Manage team access, roles, and account status."/><UsersManager data={users}/></div>}
