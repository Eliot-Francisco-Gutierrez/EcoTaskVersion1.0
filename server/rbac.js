const roles = {
  admin: {
    id: 'admin',
    name: 'Administrador',
    permissions: [
      'users.read',
      'users.write',
      'tasks.read',
      'tasks.write',
      'tasks.complete',
      'requests.read',
      'requests.write',
      'notifications.read',
      'notifications.write',
      'audit.read',
      'reports.read',
      'settings.write',
    ],
  },
  supervisor: {
    id: 'supervisor',
    name: 'Supervisor',
    permissions: [
      'users.read',
      'tasks.read',
      'tasks.write',
      'tasks.complete',
      'requests.read',
      'requests.write',
      'notifications.read',
      'notifications.write',
      'reports.read',
    ],
  },
  encargado: {
    id: 'encargado',
    name: 'Encargado',
    permissions: [
      'tasks.read',
      'tasks.write',
      'tasks.complete',
      'requests.read',
      'requests.write',
      'notifications.read',
      'notifications.write',
      'reports.read',
    ],
  },
  operator: {
    id: 'operator',
    name: 'Operario',
    permissions: [
      'tasks.read',
      'tasks.complete',
      'requests.read',
      'requests.write',
      'notifications.read',
    ],
  },
}

const permissionCatalog = [
  'users.read',
  'users.write',
  'tasks.read',
  'tasks.write',
  'tasks.complete',
  'requests.read',
  'requests.write',
  'notifications.read',
  'notifications.write',
  'audit.read',
  'reports.read',
  'settings.write',
]

module.exports = { roles, permissionCatalog }
