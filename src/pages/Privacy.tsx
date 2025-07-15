
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/container';

const Privacy = () => {
  useEffect(() => {
    document.title = "プライバシーポリシー | Queue株式会社";
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <Container className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto prose">
            <h1 className="text-3xl md:text-4xl font-bold mb-8">プライバシーポリシー</h1>
            
            <p className="mb-6">
              Queue株式会社（以下「当社」）は、当社が提供するサービス（以下「本サービス」）におけるユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
            </p>

            <h2 className="text-2xl font-semibold mt-10 mb-4">1. 個人情報の収集方法</h2>
            <p>当社は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、クレジットカード番号などの個人情報をお尋ねすることがあります。また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を当社の提携先（情報提供元、広告主、広告配信先などを含みます。以下｢提携先｣といいます。）などから収集することがあります。</p>

            <h2 className="text-2xl font-semibold mt-10 mb-4">2. 個人情報を収集・利用する目的</h2>
            <p>当社が個人情報を収集・利用する目的は、以下のとおりです。</p>
            <ol className="list-decimal pl-6">
              <li className="mb-2">本サービスの提供・運営のため</li>
              <li className="mb-2">ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
              <li className="mb-2">ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する関連サービスの案内のメールを送付するため</li>
              <li className="mb-2">メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
              <li className="mb-2">利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
              <li className="mb-2">ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
              <li className="mb-2">有料サービスにおいて、ユーザーに利用料金を請求するため</li>
              <li className="mb-2">上記の利用目的に付随する目的</li>
            </ol>

            <h2 className="text-2xl font-semibold mt-10 mb-4">3. 個人情報の第三者提供</h2>
            <p>当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。</p>
            <ol className="list-decimal pl-6">
              <li className="mb-2">法令に基づく場合</li>
              <li className="mb-2">人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li className="mb-2">公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li className="mb-2">国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
              <li className="mb-2">予め次の事項を告知あるいは公表をしている場合
                <ul className="list-disc pl-6 mb-4">
                  <li>利用目的に第三者への提供を含むこと</li>
                  <li>第三者に提供されるデータの項目</li>
                  <li>第三者への提供の手段または方法</li>
                  <li>本人の求めに応じて個人情報の第三者への提供を停止すること</li>
                </ul>
              </li>
            </ol>

            <h2 className="text-2xl font-semibold mt-10 mb-4">4. 個人情報の開示</h2>
            <p>当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。</p>
            <ol className="list-decimal pl-6">
              <li className="mb-2">本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
              <li className="mb-2">当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
              <li className="mb-2">その他法令に違反することとなる場合</li>
            </ol>
            <p>前項の定めにかかわらず、履歴情報および特性情報などの個人情報以外の情報については、原則として開示いたしません。</p>

            <h2 className="text-2xl font-semibold mt-10 mb-4">5. プライバシーポリシーの変更</h2>
            <p>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。</p>
            <p>当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。</p>

            <p className="mt-12 text-center text-sm text-gray-500">最終更新日: 2024年5月1日</p>
          </div>
        </Container>
      </main>
      
      <Footer />
    </div>
  );
};

export default Privacy;
