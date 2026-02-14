import { getApiBase } from '../core/runtime/apiBase';

export interface SignupData {
  email: string;
  password: string;
  companyName: string;
}

export async function signup(data: SignupData) {
  const response = await fetch(`${getApiBase()}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signup failed');
  }
  
  return response.json();
}

export function saveToken(token: string) {
  localStorage.setItem('auth_token', token);
}
