import { UserProfile, storageService } from './storageService.ts';

export interface RegisteredAccount extends UserProfile {
  passwordHash: string;
  createdAt: string;
  isEmailVerified: boolean;
}

const STORAGE_KEYS = {
  REGISTERED_USERS: 'aptiq_registered_users',
  ACTIVE_USER: 'aptiq_user'
};

export interface RegistrationParams {
  name: string;
  email: string;
  password: string;
  college: string;
  branch: string;
  graduationYear: number;
  targetCompany?: string;
  targetRole?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

export const authService = {
  // Get all registered student accounts from persistent storage
  getRegisteredUsers(): RegisteredAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      if (data) {
        const users: RegisteredAccount[] = JSON.parse(data);
        return users.map(u => ({
          ...u,
          isEmailVerified: true
        }));
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
          createdAt: new Date().toISOString(),
          isEmailVerified: true
        }
      ];
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(initialUsers));
      return initialUsers;
    } catch {
      return [];
    }
  },

  // Save registered students list
  saveRegisteredUsers(users: RegisteredAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save registered users', e);
    }
  },

  // Student Registration (instant login, no verification email needed)
  async registerStudent(params: RegistrationParams, autoVerify: boolean = true): Promise<AuthResponse> {
    const cleanEmail = params.email.trim().toLowerCase();

    if (!cleanEmail || !params.password || !params.name.trim()) {
      return { success: false, error: 'Full name, email, and password are required.' };
    }

    if (params.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const users = this.getRegisteredUsers();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      return {
        success: false,
        error: 'An account with this email already exists. Please sign in.'
      };
    }

    // Create new registered student account
    const newUser: RegisteredAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: params.name.trim(),
      email: cleanEmail,
      role: 'student',
      college: params.college.trim() || 'Engineering College',
      branch: params.branch.trim() || 'Computer Science & Engineering',
      graduationYear: params.graduationYear || 2026,
      targetCompany: params.targetCompany?.trim(),
      targetRole: params.targetRole?.trim(),
      passwordHash: params.password,
      createdAt: new Date().toISOString(),
      isEmailVerified: true
    };

    users.push(newUser);
    this.saveRegisteredUsers(users);

    const userProfile: UserProfile = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: 'student',
      college: newUser.college,
      branch: newUser.branch,
      graduationYear: newUser.graduationYear,
      targetCompany: newUser.targetCompany,
      targetRole: newUser.targetRole,
      isEmailVerified: true
    };

    // Set active session
    storageService.setUser(userProfile);

    return { success: true, user: userProfile };
  },

  // Login handler
  async login(
    email: string,
    password: string,
    _intentRole: 'student' | 'admin' = 'student'
  ): Promise<AuthResponse> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

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
        error: 'Incorrect password. Please try again.'
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
      targetRole: student.targetRole,
      isEmailVerified: true
    };

    storageService.setUser(studentProfile);
    return { success: true, user: studentProfile };
  },

  // Toggle or force verification status
  setUserVerificationStatus(email: string, verified: boolean): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getRegisteredUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx !== -1) {
      users[idx].isEmailVerified = verified;
      this.saveRegisteredUsers(users);
      return true;
    }
    return false;
  },

  // Delete student account
  deleteStudentAccount(email: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getRegisteredUsers();
    const filtered = users.filter(u => u.email.toLowerCase() !== cleanEmail);
    if (filtered.length !== users.length) {
      this.saveRegisteredUsers(filtered);
      return true;
    }
    return false;
  },

  // Logout
  logout(): void {
    storageService.clearUser();
  },

  // Check if current logged-in user is verified Master Admin
  isMasterAdmin(_user?: UserProfile | null): boolean {
    return false;
  }
};
