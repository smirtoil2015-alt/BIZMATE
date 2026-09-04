import { listOrgRecords } from '@/lib/firestore-service';
import type { BusinessInsight, Customer, Project } from '@/types/business';

export async function buildBusinessContext(organizationId: string) {
  const [customers, projects, insights] = await Promise.all([
    listOrgRecords<Customer>(organizationId, 'customers'),
    listOrgRecords<Project>(organizationId, 'projects'),
    listOrgRecords<BusinessInsight>(organizationId, 'insights'),
  ]);

  const activeCustomers = customers.filter((c) => c.status === 'active').length;
  const atRiskProjects = projects.filter((p) => p.status === 'at-risk').length;
  const pipelineValue = customers.reduce((sum, c) => sum + Number(c.value ?? 0), 0);
  const criticalInsights = insights.filter((i) => i.severity === 'critical').length;

  return {
    organizationId,
    summary: {
      customers: customers.length,
      activeCustomers,
      projects: projects.length,
      atRiskProjects,
      pipelineValue,
      criticalInsights,
    },
    customers: customers.slice(0, 25).map((c) => ({
      name: c.name,
      status: c.status,
      value: Number(c.value ?? 0),
    })),
    projects: projects.slice(0, 25).map((p) => ({
      name: p.name,
      status: p.status,
      progress: Number(p.progress ?? 0),
    })),
    insights: insights.slice(0, 25).map((i) => ({
      title: i.title,
      severity: i.severity,
      description: i.description,
    })),
  };
}

export function answerFromBusinessContext(question: string, context: Awaited<ReturnType<typeof buildBusinessContext>>) {
  const q = question.toLowerCase();
  const { summary } = context;

  if (q.includes('عميل') || q.includes('customer')) {
    return `لديك ${summary.customers} عميل، منهم ${summary.activeCustomers} عملاء نشطون، وإجمالي قيمة العملاء المسجلة ${summary.pipelineValue.toLocaleString()}.`;
  }
  if (q.includes('مشروع') || q.includes('project')) {
    return `لديك ${summary.projects} مشروع، منها ${summary.atRiskProjects} مشاريع بحالة خطر وتحتاج متابعة.`;
  }
  if (q.includes('خطر') || q.includes('risk')) {
    return `حالياً يوجد ${summary.atRiskProjects} مشاريع معرضة للخطر و${summary.criticalInsights} تنبيهات حرجة في بيانات الشركة.`;
  }
  if (q.includes('ملخص') || q.includes('وضع') || q.includes('business')) {
    return `ملخص BIZMATE: ${summary.customers} عميل، ${summary.projects} مشروع، ${summary.atRiskProjects} مشاريع معرضة للخطر، وقيمة مسجلة قدرها ${summary.pipelineValue.toLocaleString()}.`;
  }

  return 'أستطيع تحليل العملاء والمشاريع والمخاطر والمؤشرات الموجودة في مساحة شركتك. جرّب أن تسألني عن العملاء، المشاريع، المخاطر أو ملخص الشركة.';
}
