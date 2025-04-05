import Hero from './hero';
import MobilePhone from './mobile-phone';
import OTPCode from './otp-code';

export const metadata = {
  title: "Login",
  description: "Your Financial Bridge, Always Connected."
}

export default function LoginPage() {
  return (
    <div className="h-full p-5">
      <div className="grid grid-col-1 md:grid-cols-2 md:h-full gap-5">
      <Hero />
      <div className="flex flex-col justify-center">
        <div className="xl:p-20">
          <h2>Welcome back!</h2>
          <div className="flex flex-col gap-5">
            <MobilePhone />
            <OTPCode />
            <button className="font-light text-[var(--color-gray-dark)]">← Go back</button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}