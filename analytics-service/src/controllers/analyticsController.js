const { getAggregatedAnalytics } = require("../services/aggregatorService");
const PDFDocument = require("pdfkit");

// GET /api/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const data = await getAggregatedAnalytics(token);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error("Analytics error:", err.message);
    res.status(502).json({ success: false, message: "Failed to fetch from upstream services.", detail: err.message });
  }
};

// GET /api/export  — download CSV of all projects
exports.exportCSV = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const { researchProjects, communityProjects } = await getAggregatedAnalytics(token);
    const all = [
      ...researchProjects.map(p => ({ ...p, source: "Research" })),
      ...communityProjects.map(p => ({ ...p, source: "Community", fundingETB: p.budgetETB })),
    ];
    const headers = ["id", "title", "lead", "college", "status", "startDate", "endDate", "fundingETB", "source"];
    const rows = all.map(p => headers.map(h => `"${(p[h]||"").toString().replace(/"/g,'""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=ASTU_Projects_${new Date().toISOString().slice(0,10)}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(502).json({ success: false, message: err.message });
  }
};

// GET /api/report  — generate PDF report
exports.generatePDF = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const data = await getAggregatedAnalytics(token);
    const { summary, byStatus, byCollege, researchProjects, communityProjects } = data;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=ASTU_Analytics_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font("Helvetica-Bold").text("ASTU University Analytics Report", { align: "center" });
    doc.fontSize(11).font("Helvetica").fillColor("#555")
       .text(`Adama Science and Technology University`, { align: "center" })
       .text(`Generated: ${new Date().toLocaleDateString("en-ET", { dateStyle: "full" })}`, { align: "center" });
    doc.moveDown(1.5);

    // Summary section
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#000").text("Executive Summary");
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke("#ddd").moveDown(0.5);
    const summaryRows = [
      ["Total Projects",       summary.totalProjects],
      ["Research Projects",    summary.researchCount],
      ["Community Projects",   summary.communityCount],
      ["Active Colleges",      summary.activeColleges],
      ["Total Funding (ETB)",  summary.totalFundingETB.toLocaleString()],
      ["Total Publications",   summary.totalPublications],
      ["People Benefited",     summary.totalBeneficiaries.toLocaleString()],
      ["Volunteers Engaged",   summary.totalVolunteers],
    ];
    summaryRows.forEach(([label, value]) => {
      doc.fontSize(11).font("Helvetica-Bold").text(`${label}: `, { continued: true }).font("Helvetica").text(String(value));
    });
    doc.moveDown(1);

    // Status breakdown
    doc.fontSize(14).font("Helvetica-Bold").text("Project Status Breakdown");
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke("#ddd").moveDown(0.5);
    Object.entries(byStatus).forEach(([status, count]) => {
      doc.fontSize(11).font("Helvetica").text(`${status.charAt(0).toUpperCase()+status.slice(1)}: ${count} projects`);
    });
    doc.moveDown(1);

    // Projects by college
    doc.fontSize(14).font("Helvetica-Bold").text("Projects by College");
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke("#ddd").moveDown(0.5);
    Object.entries(byCollege).sort((a,b) => b[1]-a[1]).forEach(([college, count]) => {
      doc.fontSize(10).font("Helvetica").text(`${college}: ${count}`);
    });
    doc.moveDown(1);

    // Research projects list
    doc.addPage();
    doc.fontSize(16).font("Helvetica-Bold").text("Research Projects");
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke("#ddd").moveDown(0.5);
    researchProjects.forEach((p, i) => {
      doc.fontSize(11).font("Helvetica-Bold").text(`${i+1}. ${p.title}`);
      doc.fontSize(10).font("Helvetica").fillColor("#444")
         .text(`Lead: ${p.lead}  |  College: ${p.college}  |  Status: ${p.status}  |  Funding: ETB ${(p.fundingETB||0).toLocaleString()}`);
      if (p.summary) doc.fontSize(9).fillColor("#666").text(p.summary, { width: 500 });
      doc.fillColor("#000").moveDown(0.5);
    });

    // Community projects list
    doc.addPage();
    doc.fontSize(16).font("Helvetica-Bold").text("Community Projects");
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke("#ddd").moveDown(0.5);
    communityProjects.forEach((p, i) => {
      doc.fontSize(11).font("Helvetica-Bold").text(`${i+1}. ${p.title}`);
      doc.fontSize(10).font("Helvetica").fillColor("#444")
         .text(`Lead: ${p.lead}  |  Location: ${p.location||"Adama"}  |  Beneficiaries: ${(p.beneficiaries||0).toLocaleString()}  |  Status: ${p.status}`);
      if (p.summary) doc.fontSize(9).fillColor("#666").text(p.summary, { width: 500 });
      doc.fillColor("#000").moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    res.status(502).json({ success: false, message: err.message });
  }
};
