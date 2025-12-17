export interface User {
  id?: string;
  name: string;
  email: string;
  mobile: string;
  creditCard?: string;
  state: string;
  city: string;
  gender: string;
  hobbies: string[];
  techInterests: string[];
  address?: string;
  username: string;
  password?: string;
  confirmPassword?: string;
  dob: string | Date;
}


