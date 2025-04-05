export default function ErrorMessage({ message }) {
  return (
    <div className="bg-red-100 text-red-900 p-[15px] text-[14px]"><strong>Oops!</strong> {message}</div>
  );
}