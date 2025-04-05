import ErrorMessage from './error-message';

export default function OTPCode() {
  return (
    <>
      <p className="text-[var(--color-gray)]">We sent a code to your registered number *******7634</p>
      <div className="grid grid-cols-6 gap-[10px]">
        <input type="number" className="input--text num" />
        <input type="number" className="input--text num" />
        <input type="number" className="input--text num" />
        <input type="number" className="input--text num" />
        <input type="number" className="input--text num" />
        <input type="number" className="input--text num" />
      </div>
      <button className="button button--primary">Continue &nbsp;→</button>
      <ErrorMessage message="Error message" />
      <p className="text-center text-[var(--color-gray-dark)]">Didn't receive the code? <a href="#" className="underline text-[var(--color-gray)]">Click here to resend</a></p>
    </>
  );
}