const { sequelize, Department, Faq } = require('./models');

const departmentName = 'Accounting Department';

const faqEntries = [
  {
    question: 'How can I check my tuition balance?',
    answer: 'Ask for your balance at Window 8, the Cashier.',
    keywords: 'accounting tuition balance check remaining cashier window 8',
  },
  {
    question: 'How can I pay my tuition and other fees?',
    answer: 'Pay tuition and other outstanding school fees at Window 8, the Cashier.',
    keywords: 'accounting pay tuition fees outstanding payables cashier window 8',
  },
  {
    question: 'What payment methods are available?',
    answer: 'Tomas Claudio Colleges currently accepts cash, e-wallet payments, and card transactions.',
    keywords: 'accounting payment methods cash e-wallet card transaction',
  },
  {
    question: 'Can I pay my tuition online?',
    answer: 'Yes. E-wallet payments and card transactions are available for online payments.',
    keywords: 'accounting online payment pay tuition e-wallet card',
  },
  {
    question: 'How can I get an official receipt?',
    answer: 'After paying your fees, request or collect the receipt provided for the transaction. It contains information about your balance, including whether you have no remaining balance or still owe an amount.',
    keywords: 'accounting official receipt proof payment balance paid remaining balance',
  },
  {
    question: 'What should I do if my payment is not reflected?',
    answer: 'Contact the Accounting Department so they can check and correct the payment record. The supplied information says this is uncommon.',
    keywords: 'accounting payment not reflected missing transaction balance record error',
  },
  {
    question: 'What are the deadlines for payment?',
    answer: 'There is no single exact deadline for all fees. Outstanding financial obligations may prevent enrollment. Graduation fees should be paid before graduation; confirm applicable deadlines with Accounting.',
    keywords: 'accounting payment deadline fees enrollment outstanding balance graduation fees',
  },
  {
    question: 'Can I pay my tuition in installments?',
    answer: 'Yes. The supplied information states that the lowest installment amount is ₱2,000. Ask Accounting about the current installment schedule and terms.',
    keywords: 'accounting tuition installment payment plan minimum 2000 pesos',
  },
  {
    question: 'How can I check my remaining balance?',
    answer: 'Ask for your remaining balance at Window 8, the Cashier.',
    keywords: 'accounting remaining balance check cashier window 8 tuition',
  },
  {
    question: 'What fees do I need to pay for enrollment?',
    answer: 'The supplied information lists tuition and miscellaneous fees. Ask Accounting for your specific assessment.',
    keywords: 'accounting enrollment fees tuition miscellaneous assessment',
  },
  {
    question: 'How can I request a refund?',
    answer: 'Based on the supplied policy, a student who withdraws in writing within two weeks after classes begin and has paid fees in full or for a period longer than one month may be charged 10% of the total amount due for the term when withdrawing in the first week, or 20% when withdrawing in the second week, whether or not they attended. Refunds are not allowed after that period. Confirm your case and the current policy with Accounting.',
    keywords: 'accounting refund withdrawal written request first week second week 10 percent 20 percent tuition fees',
  },
  {
    question: 'What are the Accounting Office hours?',
    answer: 'The Accounting Office is open Monday to Friday, 8:00 AM to 5:00 PM.',
    keywords: 'accounting office hours schedule monday friday 8 am 5 pm',
  },
  {
    question: 'What scholarships are available?',
    answer: 'The supplied information lists scholarships for high school honors graduates: valedictorians receive a 100% scholarship and salutatorians receive 75% for one school year. First, second, and third honorable mentions receive 50% for one school year. Graduates of the local senior high school may receive two semesters of full or partial scholarship, depending on their case. Confirm eligibility with the school.',
    keywords: 'accounting scholarships valedictorian salutatorian honors 100 percent 75 percent honorable mention local senior high school',
  },
  {
    question: 'What other scholarships or discounts are available?',
    answer: 'The supplied information lists TCC Band Majorettes at 100%, TCC Band Players at 50%, a siblings discount at 20%, TCC regular employees and faculty members at 100%, and their dependents at 50%. Confirm current eligibility and terms with the school.',
    keywords: 'accounting scholarships discounts band majorettes band players siblings employees faculty dependents 100 50 20 percent',
  },
  {
    question: 'Are academic scholarships currently available?',
    answer: 'The supplied information says no academic scholarship is currently available. Other scholarship programs and discounts may still apply; confirm current options with the school.',
    keywords: 'accounting academic scholarship currently available no scholarship options',
  },
];

async function seed() {
  const transaction = await sequelize.transaction();

  try {
    const [department] = await Department.findOrCreate({
      where: { name: departmentName },
      defaults: {
        name: departmentName,
        description: 'Handles tuition balances, payments, fees, receipts, refunds, and scholarship inquiries.',
        location: 'Window 8, Cashier',
        office_hours: 'Mon-Fri 8AM-5PM',
      },
      transaction,
    });

    let added = 0;
    let updated = 0;
    for (const entry of faqEntries) {
      const [faq, created] = await Faq.findOrCreate({
        where: { department_id: department.id, question: entry.question },
        defaults: { department_id: department.id, ...entry },
        transaction,
      });
      if (created) {
        added += 1;
      } else if (faq.answer !== entry.answer || faq.keywords !== entry.keywords) {
        await faq.update({ answer: entry.answer, keywords: entry.keywords }, { transaction });
        updated += 1;
      }
    }

    await transaction.commit();
    console.log(`Accounting FAQ seed complete. Department: ${department.name}. Added ${added} FAQ(s), updated ${updated}.`);
  } catch (error) {
    await transaction.rollback();
    console.error('Accounting FAQ seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
