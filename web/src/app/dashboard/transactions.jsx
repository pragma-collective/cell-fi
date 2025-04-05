export default function Transactions () {
  return (
    <>
      <h2 className="text-[var(--color-english-violet)] mb-5">Recent Transactions</h2>
      <div className="overflow-auto">
        <table className="w-full">
          <thead>
          <tr className="border-y border-[var(--color-gray)]">
            <th>ID</th>
            <th>Hash</th>
            <th className="!text-center">Type</th>
            <th className="!text-right">Amount</th>
            <th className="!text-right">Status</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>6431</td>
            <td><a href="#">fabfd359632ca948bc8fa783e219fe9dd9ddce65 ↗</a></td>
            <td className="!text-center">Pay</td>
            <td className="!text-right font-bold text-[var(--color-secondary)]">$5341.23</td>
            <td className="!text-right text-green-700">Success</td>
          </tr>
          <tr>
            <td>6275</td>
            <td><a href="#">swjfd359632ca948bc8fa783e219fe9dd9ddcrt5 ↗</a></td>
            <td className="!text-center">Pay</td>
            <td className="!text-right font-bold text-[var(--color-secondary)]">$312.05</td>
            <td className="!text-right text-green-700">Success</td>
          </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}