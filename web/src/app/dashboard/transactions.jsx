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
            <th>Type</th>
            <th>Amount</th>
            <th className="!text-right">Status</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>6431</td>
            <td><a href="#">fabfd359632ca948bc8fa783e219fe9dd9ddce65 ↗</a></td>
            <td>Kalabaw</td>
            <td>5341.23</td>
            <td className="!text-right">Success</td>
          </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}