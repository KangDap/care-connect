import { prisma } from '@/lib/prisma';

import { UserActions } from './UserActions';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      createdAt: true,
    },
  });

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-black text-[#193c1f]">
          Users Moderation
        </h1>
        <p className="text-[#8ea087] font-medium">
          Manage and moderate user accounts in the platform.
        </p>
      </div>

      <div className="bg-white border border-[#d0d5cb] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#f7f3ed] text-[11px] text-[#8ea087] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f7f3ed] text-sm">
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-[#8ea087] font-medium"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#f7f3ed]/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-[#193c1f]">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-gray-600 font-bold">
                    {user.role}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {fmtDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    {user.banned ? (
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-200">
                        NON-ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200">
                        ACTIVE
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <UserActions
                      id={user.id}
                      role={user.role}
                      banned={user.banned}
                      name={user.name}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
