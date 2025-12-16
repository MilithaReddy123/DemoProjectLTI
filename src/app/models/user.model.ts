export interface User {
  id?: number;
  name: string;
  email: string;
  mobile: string;
  creditCard?: string;
  state: string;
  city: string;
  gender: string;
  hobbies: string[];
  techInterests: string[];
  additionalInfo?: string;
  username: string;
  password?: string;
  confirmPassword?: string;
  dob: string | Date;
}


