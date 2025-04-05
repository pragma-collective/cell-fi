import Hero from './hero';

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
          <p className="text-[var(--color-gray-dark)] mb-5">Enter your phone number to continue.</p>
            <input type="text" className="input input--text" placeholder="Phone number" />
            <button className="button button--primary">Continue →</button>
            <p className="text-[var(--color-gray)]">We sent a code to your registered number *******7634</p>
            <div className="grid grid-cols-6 gap-[10px]">
              <input type="number" className="input--text num" />
              <input type="number" className="input--text num" />
              <input type="number" className="input--text num" />
              <input type="number" className="input--text num" />
              <input type="number" className="input--text num" />
              <input type="number" className="input--text num" />
            </div>
            <p className="text-center text-[var(--color-gray-dark)]">Didn't receive the code? <a className="underline text-[var(--color-gray)]">Click here to resend</a></p>
            <button className="font-light text-[var(--color-gray-dark)]">← Go back</button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}