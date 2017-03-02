frappe.provide('eden_sales.po');

frappe.ui.form.on("Purchase Order", {
    refresh: function (frm) {
        if (frm.doc.docstatus == 1) {
            frm.add_custom_button(__('Send to Company'), function () {
                eden_sales.po.sendToCompany(frm);
            });
        }
    }
});

eden_sales.po = {
    sendToCompany: function (frm) {
        var dialog = new frappe.ui.Dialog({
            title: __('Send to Company'),
            fields: [
                {
                    fieldname: 'company', label: __('Company'),
                    fieldtype: 'Link', options: 'Company', get_query: function () {
                        return {
                            filters: [["Company", "name", "!=", frm.doc.company]]
                        }
                    }
                },
                {
                    fieldtype: "Button", label: __("Send"), fieldname: "send"
                }
            ]
        });

        dialog.fields_dict.send.$input.removeClass('btn-default btn-xs');
        dialog.fields_dict.send.$input.addClass('btn-primary btn-sm');
        dialog.fields_dict.send.$input.click(function() {
			var args = dialog.get_values();
			if(!args) return;
			dialog.hide();
			return frappe.call({
				type: "GET",
				method: "eden_sales.purchase_order.make_sales_order",
				args: {
					source_name: frm.doc.name,
					for_company: args.company
				},
				freeze: true,
				callback: function(r) {
					if(!r.exc) {
						var doc = frappe.model.sync(r.message);
						frappe.set_route("Form", r.message.doctype, r.message.name);
					}
				}
			})
		});

        dialog.show();
    }
};