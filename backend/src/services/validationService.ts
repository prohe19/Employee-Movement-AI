import type { Announcement, AnnouncementEmployee, MovementType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { isAssignmentLike } from "./narrationService";

export interface ValidationRuleResult {
  code: string;
  label: string;
  passed: boolean;
  message?: string;
}

export interface ValidationReport {
  valid: boolean;
  rules: ValidationRuleResult[];
}

type AnnouncementWithEmployees = Announcement & { employees: AnnouncementEmployee[] };

function rule(code: string, label: string, passed: boolean, message?: string): ValidationRuleResult {
  return { code, label, passed, message: passed ? undefined : message };
}

export async function validateAnnouncement(
  announcement: AnnouncementWithEmployees
): Promise<ValidationReport> {
  const rules: ValidationRuleResult[] = [];

  rules.push(
    rule(
      "number_present",
      "Announcement number present",
      !!announcement.number && announcement.number.trim().length > 0,
      "Announcement number is required."
    )
  );

  if (announcement.number) {
    const duplicate = await prisma.announcement.findFirst({
      where: { number: announcement.number, id: { not: announcement.id } },
    });
    rules.push(
      rule(
        "number_unique",
        "Announcement number is unique",
        !duplicate,
        `Announcement number "${announcement.number}" is already used by another announcement.`
      )
    );
  }

  rules.push(
    rule(
      "announcement_date_present",
      "Announcement date present",
      !!announcement.announcementDate,
      "Announcement date is required."
    )
  );

  rules.push(
    rule(
      "movement_type_selected",
      "Movement type selected",
      !!announcement.movementType,
      "A movement type must be selected."
    )
  );

  rules.push(
    rule(
      "template_selected",
      "Template selected",
      !!announcement.templateId,
      "A letter template must be selected."
    )
  );

  rules.push(
    rule(
      "has_employees",
      "At least one employee listed",
      announcement.employees.length > 0,
      "At least one employee must be listed on the announcement."
    )
  );

  const movementType: MovementType = announcement.movementType;
  const assignmentLike = isAssignmentLike(movementType);

  for (const emp of announcement.employees) {
    const label = emp.employeeName || `Employee ${emp.id.slice(0, 8)}`;

    rules.push(
      rule(
        `emp_${emp.id}_name`,
        `${label}: name present`,
        !!emp.employeeName && emp.employeeName.trim().length > 0,
        `${label}: employee name is required.`
      )
    );
    rules.push(
      rule(
        `emp_${emp.id}_current_position`,
        `${label}: current position present`,
        !!emp.currentPosition,
        `${label}: current position is required.`
      )
    );
    rules.push(
      rule(
        `emp_${emp.id}_new_position`,
        `${label}: new/assigned position present`,
        !!emp.newPosition,
        `${label}: new/assigned position is required.`
      )
    );
    rules.push(
      rule(
        `emp_${emp.id}_current_js`,
        `${label}: current JS present`,
        emp.currentJs !== null && emp.currentJs !== undefined,
        `${label}: current JS is required.`
      )
    );

    if (assignmentLike) {
      const hasStart = !!emp.assignmentStartDate;
      const hasEnd = !!emp.assignmentEndDate;
      rules.push(
        rule(
          `emp_${emp.id}_assignment_dates`,
          `${label}: assignment start & end dates present`,
          hasStart && hasEnd,
          `${label}: both assignment start and end dates are required.`
        )
      );
      if (hasStart && hasEnd) {
        rules.push(
          rule(
            `emp_${emp.id}_assignment_end_after_start`,
            `${label}: assignment end date after start date`,
            emp.assignmentEndDate!.getTime() > emp.assignmentStartDate!.getTime(),
            `${label}: assignment end date must be after the start date.`
          )
        );
      }
    } else if (movementType !== "EndOfAssignment") {
      rules.push(
        rule(
          `emp_${emp.id}_effective_date`,
          `${label}: effective date present`,
          !!emp.effectiveDate,
          `${label}: effective date is required.`
        )
      );
    } else {
      rules.push(
        rule(
          `emp_${emp.id}_assignment_end_date`,
          `${label}: assignment end date present`,
          !!emp.assignmentEndDate,
          `${label}: assignment end date is required to conclude the assignment.`
        )
      );
    }
  }

  const knownJs = announcement.employees.map((e) => e.currentJs);
  const allJsKnown = knownJs.every((v) => v !== null && v !== undefined);
  rules.push(
    rule(
      "signatory_determined",
      "Signatory determined",
      !!announcement.signatoryId && allJsKnown,
      "Signatory cannot be determined because the employee's current JS is missing or unclear."
    )
  );

  return {
    valid: rules.every((r) => r.passed),
    rules,
  };
}
