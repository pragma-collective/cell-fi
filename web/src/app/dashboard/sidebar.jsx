export default function Sidebar() {
  return (
    <div className="col-span-3 xl:col-span-2">
      <ul className="h6 flex flex-col gap-[15px] mt-10">
        <li className="border-l-2 border-[var(--color-primary)] pl-[20px]"><a href="#">Dashboard</a></li>
        <li className="text-[var(--color-gray-dark)] pl-[22px]"><a href="#">Transactions</a></li>
        <li className="text-[var(--color-gray-dark)] pl-[22px]"><a href="#">Settings</a></li>
        <li className="text-[var(--color-gray-dark)] pl-[22px]"><a href="#">Logout</a></li>
      </ul>
    </div>
  );
}