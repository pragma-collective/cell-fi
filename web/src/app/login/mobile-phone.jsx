import ErrorMessage from './error-message';

export default function MobilePhone() {
  return (
    <>
      <p className="text-[var(--color-gray-dark)] mb-5">Enter your phone number to continue.</p>
      <input type="text" className="input input--text" placeholder="Phone number" />
      <button className="button button--primary">Continue &nbsp;→</button>
      <ErrorMessage message="Error message" />
    </>
  );
}