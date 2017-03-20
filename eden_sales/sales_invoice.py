# -*- coding: utf-8 -*-

from __future__ import unicode_literals
import frappe
from erpnext.buying.doctype.purchase_order.purchase_order import make_purchase_invoice
from frappe.utils.data import flt, today


@frappe.whitelist()
def send_to_company(name):
	doc = frappe.get_doc("Sales Invoice", name)

	from_so = next(d.sales_order for d in doc.items if d.sales_order)
	if not from_so:
		frappe.throw("No linked Sales Order found")

	so = frappe.get_doc("Sales Order", from_so)
	if not so.dropship_order or not so.po_no:
		frappe.throw("Linked Sales Order {0} must be dropship to use this feature".format(so.name))

	po = frappe.get_doc("Purchase Order", so.po_no)
	if flt(po.per_billed, 2) < 100:
		pi = make_purchase_invoice(po.name)
		pi.bill_no = doc.name
		pi.bill_date = today()

		for item in pi.items:
			for source_item in doc.items:
				if source_item.item_code == item.item_code:
					item.update({
						"qty": source_item.qty
					})

		pi.save()
		frappe.db.commit()

		return pi