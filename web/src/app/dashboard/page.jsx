import Image from "next/image";

export default function Dashboard() {
  return (
    <div className="h-full p-5">
      <div className="grid grid-cols-12 mb-5">
        <div className="col-span-3 flex items-center">
          <Image src="/logo.svg" width={250} height={55} className="max-w-[120px] h-auto" alt="logo" />
        </div>
        <div className="col-span-9">
          <div className="flex items-center justify-between">
            <h3>Dashboard</h3>
            <div className="flex items-center gap-[10px]">
              <img src="https://randomuser.me/api/portraits/men/93.jpg" width={128} height={128} className="w-[32px] h-[32px] object-cover rounded-full" alt="" />
              <div>
                <h6 className="!text-[14px] !font-bold text-[var(--color-gray)]">Jhuds Bayutot</h6>
                <p className="!text-[12px] text-right text-[var(--color-gray-dark)]">********7634</p>
                </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-12 mb-5 hidden">
        <div className="col-span-3 flex items-center">
          <Image src="/logo.svg" width={250} height={55} className="max-w-[120px] h-auto" alt="logo" />
        </div>
        <div className="col-span-9">
          <div className="flex items-center justify-between">
            <h3>Dashboard</h3>
            <div className="flex items-center gap-[30px]">
              <div className="flex flex-col gap-[5px] leading-none">
                <div className="h2 font-bold text-[var(--color-primary)]">$309.14</div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[var(--color-primary)] font-bold">Current</span>
                    <span className="text-[12px]">$314,150.00</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-[5px] leading-none">
                <div className="h2 font-bold text-[var(--color-tertiary)]">$309.14</div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[var(--color-gray-dark)] font-bold">Savings</span>
                    <span className="text-[12px]">$314,150.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-12">
        <div className="col-span-3">
          <ul className="h6 flex flex-col gap-[15px] mt-10">
            <li className="border-l-2 border-[var(--color-primary)] pl-[20px]"><a href="#">Dashboard</a></li>
            <li className="text-[var(--color-gray-dark)] pl-[22px]"><a href="#">All Transactions</a></li>
            <li className="text-[var(--color-gray-dark)] pl-[22px]"><a href="#">Settings</a></li>
          </ul>
        </div>
        <div className="col-span-9">
          <div className="w-full bg-white text-[var(--color-dark-purple)] rounded-[8px] p-10">
            <div className="grid grid-cols-2 gap-10 leading-none">
              <div className="flex flex-col gap-[10px]">
                <div className="h5 text-[var(--color-dark-purple)]">Current</div>
                <div className="h1 font-bold text-[var(--color-primary)]">$309.14</div>
                <div className="text-[14px] text-[var(--color-gray-dark)]">$314,150.00</div>
              </div>
              <div className="flex flex-col gap-[10px]">
                <div className="h5 text-[var(--color-dark-purple)]">Savings</div>
                <div className="h1 font-bold text-[var(--color-tertiary)]">$240.54</div>
                <div className="text-[14px] text-[var(--color-gray-dark)]">$314,150.00</div>
              </div>
            </div>
            <hr className="border-[var(--color-gray)] my-10 -mx-10" />
            <h2 className="text-[var(--color-english-violet)] mb-5">Recent Transactions</h2>
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
        </div>
      </div>
    </div>
  );
}