'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  CalendarIcon,
  ChartBarIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

const navigation = {
  PATIENT: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Appointments', href: '/appointments', icon: CalendarIcon },
    { name: 'Medical Records', href: '/medical-records', icon: FolderIcon },
    { name: 'Prescriptions', href: '/prescriptions', icon: DocumentTextIcon },
    { name: 'Billing', href: '/billing', icon: CurrencyDollarIcon },
  ],
  DOCTOR: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'My Schedule', href: '/schedule', icon: ClockIcon },
    { name: 'Patients', href: '/patients', icon: UsersIcon },
    { name: 'Appointments', href: '/appointments', icon: CalendarIcon },
    { name: 'Medical Records', href: '/medical-records', icon: FolderIcon },
    { name: 'Nurses', href: '/nurses', icon: UserGroupIcon },
  ],
  NURSE: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Assigned Patients', href: '/assigned-patients', icon: UsersIcon },
    { name: 'Tasks', href: '/tasks', icon: ClockIcon },
    { name: 'Vital Signs', href: '/vital-signs', icon: ChartBarIcon },
  ],
  ADMIN: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Users', href: '/users', icon: UsersIcon },
    { name: 'Appointments', href: '/appointments', icon: CalendarIcon },
    { name: 'Staff Schedule', href: '/staff-schedule', icon: ClockIcon },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
    { name: 'Billing', href: '/billing', icon: CurrencyDollarIcon },
  ],
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function Sidebar() {
  const { data: session } = useSession()
  const userRole = session?.user?.role || 'PATIENT'
  const currentNavigation = navigation[userRole as keyof typeof navigation]

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          {/* Logo space */}
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {currentNavigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={classNames(
                        item.href === window.location.pathname
                          ? 'bg-gray-50 text-primary-600'
                          : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )}
                    >
                      <item.icon
                        className={classNames(
                          item.href === window.location.pathname
                            ? 'text-primary-600'
                            : 'text-gray-400 group-hover:text-primary-600',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}