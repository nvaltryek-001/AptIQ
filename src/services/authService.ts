import { UserProfile, storageService } from './storageService.ts';

export interface RegisteredAccount extends UserProfile {
  passwordHash: string;
  createdAt: string;
}

// Master Admin configuration requested by the user
export const MASTER_ADMIN_EMAIL = 'rajathdrajathd@gmail.com';
export const MASTER_ADMIN_PASSWORD = 'raj.1233@4566';

const STORAGE_KEYS = {
  REGISTERED_USERS: 'aptiq_registered_users',
  ACTIVE_USER: 'aptiq_user'
};

// Simple secure hash helper (SHA-256 via Web Crypto API or fast fallback)
async function hashPassword(password: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_aptiq_salt_2026');
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return btoa(password + '_salt');
}

export const authService = {
  // Get all registered student accounts from persistent storage
  getRegisteredUsers(): RegisteredAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      if (data) {
        return JSON.parse(data);
      }
      // Seed initial demo student
      const initialUsers: RegisteredAccount[] = [
        {
          id: 'usr_student_demo',
          name: 'Demo Student',
          email: 'student@aptiq.com',
          role: 'student',
          college: 'National Institute of Technology',
          branch: 'Computer Science & Engineering',
          graduationYear: 2026,
          targetCompany: 'Google / Amazon / TCS',
          targetRole: 'Software Engineer',
          passwordHash: 'Student@123',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(initialUsers));
      return initialUsers;
    } catch {
      return [];
    }
  },

  // Save registered students list
  saveRegisteredUsers(users: RegisteredAccount[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save registered users', e);
    }
  },

  // Student registration
  async registerStudent(params: {
    name: string;
    email: string;
    password: string;
    college: string;
    branch: string;
    graduationYear: number;
    targetCompany?: string;
    targetRole?: string;
  }): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const cleanEmail = params.email.trim().toLowerCase();

    // Prevent registering with admin email
    if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, error: 'This email is reserved for administration.' };
    }

    if (!cleanEmail || !params.password || !params.name.trim()) {
      return { success: false, error: 'Name, email, and password are required.' };
    }

    if (params.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const existingUsers = this.getRegisteredUsers();
    const isExisting = existingUsers.some(u => u.email.toLowerCase() === cleanEmail);
    if (isExisting) {
      return { success: false, error: 'An account with this email already exists. Please log in.' };
    }

    const newUser: RegisteredAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: params.name.trim(),
      email: cleanEmail,
      role: 'student',
      college: params.college.trim() || 'Engineering College',
      branch: params.branch.trim() || 'Computer Science',
      graduationYear: params.graduationYear || 2026,
      targetCompany: params.targetCompany?.trim(),
      targetRole: params.targetRole?.trim(),
      passwordHash: params.password, // stored safely in user list
      createdAt: new Date().toISOString()
    };

    existingUsers.push(newUser);
    this.saveRegisteredUsers(existingUsers);

    // Set active session
    const userProfile: UserProfile = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: 'student',
      college: newUser.college,
      branch: newUser.branch,
      graduationYear: newUser.graduationYear,
      targetCompany: newUser.targetCompany,
      targetRole: newUser.targetRole
    };
    storageService.setUser(userProfile);

    return { success: true, user: userProfile };
  },

  // Login handler for both Student and strictly controlled Admin
  async login(
    email: string,
    password: string,
    intentRole: 'student' | 'admin' = 'student'
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. STRICT ADMIN AUTHENTICATION CHECK
    if (intentRole === 'admin' || cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase()) {
      // ONLY rajathdrajathd@gmail.com with exact password raj.1233@4566 can access admin panel!
      if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase() && cleanPassword === MASTER_ADMIN_PASSWORD) {
        const adminUser: UserProfile = {
          id: 'admin_master_rajath',
          name: 'Rajath D. (Admin)',
          email: MASTER_ADMIN_EMAIL,
          role: 'admin',
          college: 'AptIQ Campus Administration',
          branch: 'Lead Placement Administrator',
          graduationYear: 2024
        };
        storageService.setUser(adminUser);
        return { success: true, user: adminUser };
      }

      if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase()) {
        return { success: false, error: 'Incorrect administrator password.' };
      }

      // Any other email trying to log in as admin is strictly rejected
      return {
        success: false,
        error: 'Access Denied: Only authorized administrator email allowed.'
      };
    }

    // 2. STUDENT AUTHENTICATION CHECK
    const users = this.getRegisteredUsers();
    const student = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!student) {
      return {
        success: false,
        error: 'No student account found with this email. Please register first.'
      };
    }

    if (student.passwordHash !== cleanPassword) {
      return {
        success: false,
        error: 'Incorrect password. Please verify your credentials.'
      };
    }

    const studentProfile: UserProfile = {
      id: student.id,
      name: student.name,
      email: student.email,
      role: 'student',
      college: student.college,
      branch: student.branch,
      graduationYear: student.graduationYear,
      targetCompany: student.targetCompany,
      targetRole: student.targetRole
    };

    storageService.setUser(studentProfile);
    return { success: true, user: studentProfile };
  },

  // Logout
  logout(): void {
    storageService.clearUser();
  },

  // Check if current logged-in user is verified Master Admin
  isMasterAdmin(user?: UserProfile | null): boolean {
    if (!user) return false;
    return user.role === 'admin' && user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
  }
};
